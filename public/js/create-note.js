document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth/login';
        return;
    }

    try {
        // Initialize editors with same settings as view/edit
        await Promise.all([
            initializeRichEditor('content', { height: 400 }),
            initializeRichEditor('cue_column', { height: 200 }),
            initializeRichEditor('summary', { height: 200 })
        ]);

        // Load categories
        const response = await fetch('/api/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const categories = await response.json();
        const categorySelect = document.getElementById('category');
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to initialize:', error);
        showError('Failed to initialize editor');
    }
});

document.getElementById('createNoteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
        setLoading(true);

        // Get HTML content from TinyMCE editors
        const contentHtml = tinymce.get('content').getContent();
        const cueHtml = tinymce.get('cue_column').getContent();
        const summaryHtml = tinymce.get('summary').getContent();
        
        // Convert HTML to Markdown for storage
        const contentMarkdown = htmlToMarkdown(contentHtml);
        const cueMarkdown = htmlToMarkdown(cueHtml);
        const summaryMarkdown = htmlToMarkdown(summaryHtml);

        const formData = {
            title: document.getElementById('title').value,
            content: contentMarkdown,
            cue_column: cueMarkdown,
            summary: summaryMarkdown,
            category_id: document.getElementById('category').value || null,
            tags: document.getElementById('tags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
        };

        // Validate content
        const { isValid, errors, sanitizedData } = validateNoteContent(formData);
        
        if (!isValid) {
            throw new Error(errors.join('\n'));
        }

        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(sanitizedData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create note');
        }

        const result = await response.json();
        window.location.href = `/notes/${result.noteId}`;
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Failed to create note');
    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) {
    const submitButton = document.querySelector('#createNoteForm button[type="submit"]');
    if (isLoading) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating...';
    } else {
        submitButton.disabled = false;
        submitButton.textContent = 'Create Note';
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
    setTimeout(() => alertDiv.remove(), 5000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    tinymce.remove('#content');
    tinymce.remove('#cue_column');
    tinymce.remove('#summary');
});