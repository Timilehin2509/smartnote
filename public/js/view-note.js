document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth/login';
        return;
    }

    const noteId = window.location.pathname.split('/').pop();
    await loadNote(noteId, token);
    setupEventListeners(noteId, token);
    
    // Initialize note linking
    const linkManager = new NoteLinkManager(noteId);
    await linkManager.initialize();  // Add this line
});

async function loadNote(noteId, token) {
    try {
        console.log('Loading note:', noteId);
        const response = await fetch(`/api/notes/${noteId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const note = await response.json();
        console.log('Loaded note data:', note);  // Debug log
        
        if (!response.ok) throw new Error(note.error || 'Failed to load note');
        
        displayNote(note);
    } catch (error) {
        console.error('Error loading note:', error);
        showError(error.message || 'Failed to load note');
    }
}

// Update displayNote in view-note.js
// Modified displayNote function
function displayNote(note) {
    try {
        document.getElementById('noteTitle').textContent = note.title || '';
        
        // Log the note data
        console.log('Displaying note:', {
            title: note.title,
            content: note.content,
            cue_column: note.cue_column,
            summary: note.summary
        });

        // Set content
        document.getElementById('content').innerHTML = marked.parse(note.content || '');
        document.getElementById('content').setAttribute('data-raw', note.content || '');
        
        // Set cue column
        document.getElementById('cueColumn').innerHTML = marked.parse(note.cue_column || '');
        document.getElementById('cueColumn').setAttribute('data-raw', note.cue_column || '');
        
        // Set summary
        document.getElementById('summary').innerHTML = marked.parse(note.summary || '');
        document.getElementById('summary').setAttribute('data-raw', note.summary || '');
        
        const category = document.getElementById('category');
        if (note.category_name) {
            category.textContent = note.category_name;
            category.setAttribute('data-id', note.category_id);
            category.style.display = 'inline-block';
        } else {
            category.style.display = 'none';
        }

        // Fix tags handling
        const tagsContainer = document.getElementById('tags');
        let tagArray = [];
        
        if (typeof note.tags === 'string') {
            try {
                tagArray = JSON.parse(note.tags);
            } catch (e) {
                console.log('Tags parsing error:', e);
                tagArray = [];
            }
        } else if (Array.isArray(note.tags)) {
            tagArray = note.tags;
        }
        
        if (tagArray.length > 0) {
            tagsContainer.innerHTML = tagArray.map(tag => 
                `<span class="badge bg-secondary me-1">${tag}</span>`
            ).join('');
            // Update edit form tags if in edit mode
            const editTags = document.getElementById('editTags');
            if (editTags) {
                editTags.value = tagArray.join(', ');
            }
        } else {
            tagsContainer.innerHTML = '';
        }

        // Display linked notes
        const linkedNotesContainer = document.getElementById('linkedNotesDisplay');
        if (note.linkedNotes && note.linkedNotes.length > 0) {
            linkedNotesContainer.innerHTML = note.linkedNotes.map(linkedNote => `
                <a href="/notes/${linkedNote.id}" class="text-decoration-none">
                    <div class="linked-note-card ${linkedNote.link_type}">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0">
                                ${linkedNote.link_type === 'incoming' ? '← ' : '→ '}
                                ${linkedNote.title}
                            </h6>
                            <span class="badge bg-${linkedNote.link_type === 'incoming' ? 'success' : 'primary'}">
                                ${linkedNote.link_type}
                            </span>
                        </div>
                        <p class="small text-muted mb-0">
                            ${linkedNote.category_name || 'Uncategorized'} • 
                            ${new Date(linkedNote.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </a>
            `).join('');
        } else {
            linkedNotesContainer.innerHTML = '<p class="text-muted">No linked notes</p>';
        }
    } catch (error) {
        console.error('Error displaying note:', error);
        // Only alert if there's a real error, not just missing optional fields
        if (!note.title) {
            showError('Failed to display note content');
        }
    }
}

function setupEventListeners(noteId, token) {
    // Add edit button handler
    document.getElementById('editBtn').addEventListener('click', () => {
        toggleEditMode();
    });

    // Add edit form submit handler
    document.getElementById('editNoteForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateNote(noteId, token);
    });

    // Existing delete button handler
    document.getElementById('deleteBtn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this note?')) {
            try {
                const response = await fetch(`/api/notes/${noteId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    window.location.href = '/notes';
                } else {
                    throw new Error('Failed to delete note');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Failed to delete note');
            }
        }
    });
}

let contentEditor, cueEditor, summaryEditor;
let originalContent = null;

// Modified cleanupEditors function
function cleanupEditors() {
    if (contentEditor) {
        tinymce.remove('#editContent');
        contentEditor = null;
    }
    if (cueEditor) {
        tinymce.remove('#editCueColumn');
        cueEditor = null;
    }
    if (summaryEditor) {
        tinymce.remove('#editSummary');
        summaryEditor = null;
    }
}

// Remove duplicate onbeforeunload setup in toggleEditMode
// Modified toggleEditMode function
async function toggleEditMode() {
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    
    if (viewMode.style.display !== 'none') {
        // Show loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'text-center my-3';
        loadingDiv.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading editor...</span></div>';
        editMode.prepend(loadingDiv);
        
        try {
            // Switch to edit mode
            viewMode.style.display = 'none';
            editMode.style.display = 'block';

            // Get raw markdown content
            const contentMarkdown = document.getElementById('content').getAttribute('data-raw') || '';
            const cueMarkdown = document.getElementById('cueColumn').getAttribute('data-raw') || '';
            const summaryMarkdown = document.getElementById('summary').getAttribute('data-raw') || '';
            
            // Convert markdown to HTML for TinyMCE
            document.getElementById('editContent').value = markdownToHtml(contentMarkdown);
            document.getElementById('editCueColumn').value = markdownToHtml(cueMarkdown);
            document.getElementById('editSummary').value = markdownToHtml(summaryMarkdown);

            // Initialize editors
            const editorPromises = [
                initializeRichEditor('editContent', { height: 400 }),
                initializeRichEditor('editCueColumn', { height: 200 }),
                initializeRichEditor('editSummary', { height: 200 })
            ];
            
            const [content, cue, summary] = await Promise.all(editorPromises);
            contentEditor = content;
            cueEditor = cue;
            summaryEditor = summary;
            
            // Set title first
            const title = document.getElementById('noteTitle').textContent;
            document.getElementById('editTitle').value = title;

            // Load categories
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('/api/categories', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const categories = await response.json();
                
                const categorySelect = document.getElementById('editCategory');
                categorySelect.innerHTML = '<option value="">Select Category</option>';
                
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    // Set as selected if it matches current category
                    if (category.id === parseInt(document.getElementById('category').getAttribute('data-id'))) {
                        option.selected = true;
                    }
                    categorySelect.appendChild(option);
                });
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
            
            // Get tags
            const tags = Array.from(document.querySelectorAll('#tags .badge'))
                .map(tag => tag.textContent)
                .join(', ');
            document.getElementById('editTags').value = tags;

            // After all content is set, store original state
            // We need to wait a moment for TinyMCE to initialize
            setTimeout(() => {
                originalContent = {
                    title: document.getElementById('editTitle').value,
                    content: tinymce.get('editContent').getContent(),
                    cue_column: tinymce.get('editCueColumn').getContent(),
                    summary: tinymce.get('editSummary').getContent(),
                    category_id: document.getElementById('editCategory').value,
                    tags: document.getElementById('editTags').value
                };
                
                // Set up unsaved changes warning
                window.onbeforeunload = function() {
                    if (hasUnsavedChanges()) {
                        return "You have unsaved changes. Are you sure you want to leave?";
                    }
                };
            }, 500);
        } finally {
            loadingDiv.remove();
        }
    } else {
        // Prompt if there are unsaved changes
        if (hasUnsavedChanges() && !confirm('You have unsaved changes. Are you sure you want to exit?')) {
            return;
        }
        
        // Clear unsaved changes warning when exiting edit mode
        window.onbeforeunload = null;
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
        cleanupEditors();
    }
}

// Add validation function
function validateNoteContent(formData) {
    const errors = [];
    
    if (!formData.title.trim()) {
        errors.push('Title is required');
    }
    
    // Check for maximum lengths
    if (formData.title.length > 255) {
        errors.push('Title must be less than 255 characters');
    }
    
    // Basic markdown sanitization
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

// Update the updateNote function
// Modified updateNote function
async function updateNote(noteId, token) {
    try {
        setLoading(true); // Add loading state
        
        // Get HTML content from TinyMCE editors
        const contentHtml = tinymce.get('editContent').getContent();
        const cueHtml = tinymce.get('editCueColumn').getContent();
        const summaryHtml = tinymce.get('editSummary').getContent();
        
        // Convert HTML to Markdown for storage
        const contentMarkdown = htmlToMarkdown(contentHtml);
        const cueMarkdown = htmlToMarkdown(cueHtml);
        const summaryMarkdown = htmlToMarkdown(summaryHtml);
        
        const formData = {
            title: document.getElementById('editTitle').value,
            content: contentMarkdown,
            cue_column: cueMarkdown,
            summary: summaryMarkdown,
            category_id: document.getElementById('editCategory').value || null,
            tags: document.getElementById('editTags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
        };

        // Validate and sanitize
        const { isValid, errors, sanitizedData } = validateNoteContent(formData);
        
        if (!isValid) {
            throw new Error(errors.join('\n'));
        }

        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(sanitizedData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update note');
        }

        // Clear original content and unsaved changes warning
        originalContent = null;
        window.onbeforeunload = null;
        
        await loadNote(noteId, token);
        toggleEditMode();
        showError('Note updated successfully', true); // Show success message
    } catch (error) {
        console.error('Error updating note:', error);
        showError(error.message || 'Failed to update note');
    } finally {
        setLoading(false); // Remove loading state
    }
}
// TinyMCE editor initialization function
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
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                font-size: 14px;
                line-height: 1.5;
                padding: 1rem;
            }
        `,
        setup: function(editor) {
            // Add custom checklist handling
            editor.ui.registry.addToggleButton('checklist', {
                icon: 'checklist',
                tooltip: 'Toggle Task Checkbox',
                onAction: function() {
                    const selection = editor.selection.getContent();
                    const node = editor.selection.getNode();
                    
                    if (node.nodeName === 'LI') {
                        // Check if it already has a checkbox
                        if (node.innerHTML.indexOf('☐') === 0) {
                            // Change unchecked to checked
                            editor.dom.setHTML(node, node.innerHTML.replace('☐', '☑'));
                        } else if (node.innerHTML.indexOf('☑') === 0) {
                            // Change checked to unchecked
                            editor.dom.setHTML(node, node.innerHTML.replace('☑', '☐'));
                        } else {
                            // Add a new checkbox
                            editor.dom.setHTML(node, '☐ ' + node.innerHTML);
                        }
                    } else {
                        // Create a new list item with checkbox
                        editor.insertContent('<ul><li>☐ ' + (selection || '') + '</li></ul>');
                    }
                }
            });
            
            // Set up keyboard shortcuts similar to the markdown editor
            editor.addShortcut('meta+b', 'Bold', 'Bold');
            editor.addShortcut('meta+i', 'Italic', 'Italic');
            editor.addShortcut('meta+u', 'Bullet list', 'InsertUnorderedList');
            editor.addShortcut('meta+o', 'Numbered list', 'InsertOrderedList');
            editor.addShortcut('meta+t', 'Toggle checkbox', function() {
                editor.execCommand('checklist');
            });
        },
        ...options
    });
}

// Helper function to convert Markdown to HTML
function markdownToHtml(markdown) {
    return marked.parse(markdown || '');
}

// Helper function to convert HTML to Markdown (simplified)
function htmlToMarkdown(html) {
    // Simple HTML to Markdown conversion
    // This is a basic implementation - for production, consider using a library
    let markdown = html || '';
    
    // Replace common HTML elements with Markdown
    markdown = markdown
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
        .replace(/<li>☑ (.*?)<\/li>/gi, '- [x] $1\n')
        .replace(/<li>☐ (.*?)<\/li>/gi, '- [ ] $1\n')
        .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ''); // Remove any remaining tags
    
    return markdown.trim();
}
// Modified hasUnsavedChanges function
function hasUnsavedChanges() {
    if (!tinymce.get('editContent')) return false;
    
    const currentContent = {
        title: document.getElementById('editTitle').value,
        content: tinymce.get('editContent').getContent(),
        cue_column: tinymce.get('editCueColumn').getContent(),
        summary: tinymce.get('editSummary').getContent(),
        category_id: document.getElementById('editCategory').value,
        tags: document.getElementById('editTags').value
    };
    
    // Compare with original values
    return JSON.stringify(currentContent) !== JSON.stringify(originalContent);
}

function setLoading(isLoading) {
    const saveButton = document.querySelector('#editNoteForm button[type="submit"]');
    if (isLoading) {
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
    } else {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
    }
}

function showError(message, isWarning = false) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${isWarning ? 'warning' : 'danger'} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.container').prepend(alertDiv);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => alertDiv.remove(), 5000);
}

window.addEventListener('beforeunload', cleanupEditors);