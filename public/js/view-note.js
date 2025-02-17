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
        alert(error.message || 'Failed to load note');
    }
}

function displayNote(note) {
    try {
        console.log('Displaying note:', note);
        
        // Set title
        document.getElementById('noteTitle').textContent = note.title;
        
        // Set main content
        const content = document.getElementById('content');
        content.setAttribute('data-raw', note.content || '');
        content.innerHTML = marked.parse(note.content || '');
        
        // Set cue column
        const cueColumn = document.getElementById('cueColumn');
        cueColumn.setAttribute('data-raw', note.cue_column || '');
        cueColumn.innerHTML = marked.parse(note.cue_column || '');
        
        // Set summary
        const summary = document.getElementById('summary');
        summary.setAttribute('data-raw', note.summary || '');
        summary.innerHTML = marked.parse(note.summary || '');
        
        // Set category
        const category = document.getElementById('category');
        if (note.category_id) {
            category.textContent = `Category: ${note.category_id}`;
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
            alert('Failed to display note content');
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
                alert('Failed to delete note');
            }
        }
    });
}

function toggleEditMode() {
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    
    if (viewMode.style.display !== 'none') {
        // Switch to edit mode
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        
        // Get raw content
        document.getElementById('editTitle').value = document.getElementById('noteTitle').textContent;
        document.getElementById('editContent').value = document.getElementById('content').getAttribute('data-raw') || '';
        document.getElementById('editCueColumn').value = document.getElementById('cueColumn').getAttribute('data-raw') || '';
        document.getElementById('editSummary').value = document.getElementById('summary').getAttribute('data-raw') || '';
        
        // Get category
        const category = document.getElementById('category');
        if (category.style.display !== 'none') {
            document.getElementById('editCategory').value = category.getAttribute('data-id') || '';
        }
        
        // Get tags from spans and populate edit field
        const tags = Array.from(document.querySelectorAll('#tags .badge'))
            .map(tag => tag.textContent)
            .join(', ');
        document.getElementById('editTags').value = tags;
    } else {
        // Switch back to view mode
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
    }
}

async function updateNote(noteId, token) {
    try {
        console.log('Updating note:', noteId);
        const formData = {
            title: document.getElementById('editTitle').value,
            content: document.getElementById('editContent').value,
            cue_column: document.getElementById('editCueColumn').value,
            summary: document.getElementById('editSummary').value,
            category_id: document.getElementById('editCategory').value || null,
            tags: document.getElementById('editTags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
        };

        console.log('Update data:', formData);

        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update note');
        }

        await loadNote(noteId, token);
        toggleEditMode();
    } catch (error) {
        console.error('Error updating note:', error);
        alert(error.message || 'Failed to update note');
    }
}