function initializeRichEditor(elementId, options = {}) {
    return tinymce.init({
        selector: `#${elementId}`,
        height: options.height || 400,
        menubar: false,
        plugins: [
            'lists', 'autolink', 'checklist', 'link',
            'searchreplace', 'wordcount'
        ],
        toolbar: [
            'undo redo | formatselect | ' +
            'bold italic | bullist numlist checklist | ' +
            'removeformat'
        ],
        formats: {
            h1: { block: 'h1' },
            h2: { block: 'h2' },
            h3: { block: 'h3' }
        },
        statusbar: false,
        branding: false,
        content_style: `
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.5;
                padding: 1rem;
            }
            ul[data-type="taskList"] {
                list-style: none;
                padding-left: 0;
            }
            ul[data-type="taskList"] li {
                display: flex;
                align-items: flex-start;
                gap: 0.5rem;
                margin: 0.25rem 0;
            }
            ul[data-type="taskList"] li::before {
                content: "☐";
                font-size: 1.2em;
                line-height: 1;
                cursor: pointer;
            }
            ul[data-type="taskList"] li[data-checked="true"]::before {
                content: "☑";
            }
            ul[data-type="taskList"] li[data-checked="true"] {
                color: #666;
                text-decoration: line-through;
            }
        `,
        setup: function(editor) {
            editor.ui.registry.addToggleButton('checklist', {
                icon: 'checklist',
                tooltip: 'Toggle Task',
                onAction: function() {
                    const node = editor.selection.getNode();
                    const content = editor.selection.getContent() || 'New task';
                    
                    if (node.nodeName === 'LI' && node.parentNode.getAttribute('data-type') === 'taskList') {
                        const isChecked = node.getAttribute('data-checked') === 'true';
                        node.setAttribute('data-checked', !isChecked);
                    } else {
                        const html = `<ul data-type="taskList"><li data-checked="false">${content}</li></ul>`;
                        editor.insertContent(html);
                    }
                }
            });

            editor.on('click', function(e) {
                const li = e.target.closest('li');
                if (li && li.parentNode.getAttribute('data-type') === 'taskList') {
                    const isChecked = li.getAttribute('data-checked') === 'true';
                    li.setAttribute('data-checked', !isChecked);
                }
            });

            editor.addShortcut('meta+t', 'Add/toggle task', function() {
                editor.execCommand('checklist');
            });
        }
    });
}

function htmlToMarkdown(html) {
    let markdown = html || '';
    
    // Convert tasks first
    markdown = markdown
        .replace(/<ul[^>]*data-type="taskList"[^>]*>([\s\S]*?)<\/ul>/gi, function(match, items) {
            return items.replace(/<li[^>]*data-checked="(true|false)"[^>]*>(.*?)<\/li>/gi, function(_, checked, content) {
                return `- [${checked === 'true' ? 'x' : ' '}] ${content.trim()}\n`;
            });
        })
        // Rest of conversions...
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i>(.*?)<\/i>/gi, '*$1*')
        .replace(/<ul>(.*?)<\/ul>/gis, function(match, list) {
            return list.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
        })
        .replace(/<ol>(.*?)<\/ol>/gis, function(match, list) {
            let index = 1;
            return list.replace(/<li>(.*?)<\/li>/gi, function(match, item) {
                return (index++) + '. ' + item + '\n';
            });
        })
        .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '');
    
    return markdown.trim();
}

function markdownToHtml(markdown) {
    let html = markdown || '';

    // Convert tasks first
    html = html
        .replace(/^- \[([ x])\] (.*)$/gm, function(_, checked, content) {
            return `<ul data-type="taskList"><li data-checked="${checked === 'x'}">${content}</li></ul>`;
        })
        // Other conversions...
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1*')
        .replace(/^- (?!\[[ x]\])(.*)$/gm, '<ul><li>$1</li></ul>')
        .replace(/^\d+\. (.*)$/gm, '<ol><li>$1</li></ol>');

    return html;
}

function validateNoteContent(formData) {
    const errors = [];
    
    if (!formData.title?.trim()) {
        errors.push('Title is required');
    }
    
    if (formData.title?.length > 255) {
        errors.push('Title must be less than 255 characters');
    }
    
    const sanitizeMarkdown = (text) => {
        return text
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    };
    
    formData.content = sanitizeMarkdown(formData.content);
    formData.cue_column = sanitizeMarkdown(formData.cue_column);
    formData.summary = sanitizeMarkdown(formData.summary);
    
    return { isValid: errors.length === 0, errors, sanitizedData: formData };
}