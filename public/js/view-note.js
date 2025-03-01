document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth/login';
        return;
    }

    const noteId = window.location.pathname.split('/').pop();
    await loadNote(noteId, token);
    setupEventListeners(noteId, token);
});

async function loadNote(noteId, token) {
    try {
        console.log('Loading note:', noteId);
        const response = await fetch(`/api/notes/${noteId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to load note');
        }

        const note = await response.json();
        console.log('Note loaded:', note);
        displayNote(note);
    } catch (error) {
        console.error('Error loading note:', error);
        showError(error.message || 'Failed to load note');
    }
}

// Update displayNote in view-note.js
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

function cleanupEditors() {
    if (contentEditor) {
        contentEditor.toTextArea();
        contentEditor = null;
    }
    if (cueEditor) {
        cueEditor.toTextArea();
        cueEditor = null;
    }
    if (summaryEditor) {
        summaryEditor.toTextArea();
        summaryEditor = null;
    }
}

// Update toggleEditMode to properly set originalContent
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

            // Initialize editors
            await Promise.all([
                initializeMarkdownEditor('editContent', { height: '400px' }),
                initializeMarkdownEditor('editCueColumn', { height: '200px' }),
                initializeMarkdownEditor('editSummary', { height: '200px' })
            ]).then(([content, cue, summary]) => {
                contentEditor = content;
                cueEditor = cue;
                summaryEditor = summary;
            });

            // Set content
            contentEditor.value(document.getElementById('content').getAttribute('data-raw') || '');
            cueEditor.value(document.getElementById('cueColumn').getAttribute('data-raw') || '');
            summaryEditor.value(document.getElementById('summary').getAttribute('data-raw') || '');
            
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
            originalContent = {
                title: document.getElementById('editTitle').value,
                content: contentEditor.value(),
                cue_column: cueEditor.value(),
                summary: summaryEditor.value(),
                category_id: document.getElementById('editCategory').value,
                tags: document.getElementById('editTags').value
            };

            // Set up unsaved changes warning
            window.onbeforeunload = function() {
                if (hasUnsavedChanges()) {
                    return "You have unsaved changes. Are you sure you want to leave?";
                }
            };
        } finally {
            loadingDiv.remove();
        }
    } else {
        // Clear unsaved changes warning when exiting edit mode
        window.onbeforeunload = null;
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
        cleanupEditors();
    }
    
    window.onbeforeunload = function() {
        if (hasUnsavedChanges()) {
            return "You have unsaved changes. Are you sure you want to leave?";
        }
    };
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
async function updateNote(noteId, token) {
    try {
        setLoading(true); // Add loading state
        const formData = {
            title: document.getElementById('editTitle').value,
            content: contentEditor.value(),
            cue_column: cueEditor.value(),
            summary: summaryEditor.value(),
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

function initializeMarkdownEditor(elementId, options = {}) {
    return new EasyMDE({
        element: document.getElementById(elementId),
        spellChecker: false,
        status: false,
        toolbar: [
            {
                name: "bold",
                action: EasyMDE.toggleBold,
                className: "fa fa-bold",
                title: "Bold",
            },
            {
                name: "italic",
                action: EasyMDE.toggleItalic,
                className: "fa fa-italic",
                title: "Italic",
            },
            '|',
            {
                name: "heading-2",
                action: EasyMDE.toggleHeading2,
                className: "fa fa-header",
                title: "Medium Heading",
            },
            {
                name: "heading-3",
                action: EasyMDE.toggleHeading3,
                className: "fa fa-header header-smaller",
                title: "Small Heading",
            },
            '|',
            {
                name: "unordered-list",
                action: EasyMDE.toggleUnorderedList,
                className: "fa fa-list-ul",
                title: "Bullet List",
            },
            {
                name: "ordered-list",
                action: EasyMDE.toggleOrderedList,
                className: "fa fa-list-ol",
                title: "Number List",
            },
            '|',
            {
                name: "checklist",
                action: function(editor) {
                    const cm = editor.codemirror;
                    const selection = cm.getSelection();
                    const text = selection || "";
                    const cursor = cm.getCursor();
                    const line = cm.getLine(cursor.line);
                    
                    // Toggle checkbox state if it exists
                    if (line.startsWith("- [ ] ")) {
                        cm.replaceRange("- [x] " + line.substring(6), 
                            {line: cursor.line, ch: 0}, 
                            {line: cursor.line, ch: line.length});
                    } else if (line.startsWith("- [x] ")) {
                        cm.replaceRange("- [ ] " + line.substring(6), 
                            {line: cursor.line, ch: 0}, 
                            {line: cursor.line, ch: line.length});
                    } else {
                        // Add new checkbox
                        cm.replaceSelection("- [ ] " + text);
                    }
                },
                className: "fa fa-check-square",
                title: "Toggle Task Checkbox",
            },
            '|',
            {
                name: "clean-block",
                action: EasyMDE.cleanBlock,
                className: "fa fa-eraser",
                title: "Clean Formatting",
            },
            '|',
            {
                name: "preview",
                action: EasyMDE.togglePreview,
                className: "fa fa-eye",
                title: "Toggle Preview",
            }
        ],
        shortcuts: {
            "toggleBold": "Ctrl-B",
            "toggleItalic": "Ctrl-I",
            "toggleUnorderedList": "Ctrl-U",
            "toggleOrderedList": "Ctrl-O",
            "cleanBlock": "Ctrl-E",
            "toggleChecklist": "Ctrl-T"
        },
        minHeight: options.height || "200px",
        maxHeight: options.height || "400px",
        previewRender: function(plainText) {
            // Use same styling as view mode
            return `<div class="preview-content">${marked.parse(plainText)}</div>`;
        },
        sideBySideFullscreen: false,
    });
}

function hasUnsavedChanges() {
    if (!contentEditor) return false;
    
    const currentContent = {
        title: document.getElementById('editTitle').value,
        content: contentEditor.value(),
        cue_column: cueEditor.value(),
        summary: summaryEditor.value(),
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