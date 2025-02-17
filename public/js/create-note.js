document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth/login';
        return;
    }

    // Load categories
    try {
        const response = await fetch('/api/categories', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const categories = await response.json();
        const categorySelect = document.getElementById('category');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
});

document.getElementById('createNoteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const tags = document.getElementById('tags').value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

    const noteData = {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        cue_column: document.getElementById('cue_column').value,
        summary: document.getElementById('summary').value,
        category_id: document.getElementById('category').value || null,
        tags: tags
    };

    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(noteData)
        });

        if (response.ok) {
            window.location.href = '/notes';
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to create note');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to create note');
    }
});