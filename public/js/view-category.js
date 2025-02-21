document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth/login';
        return;
    }

    const categoryId = window.location.pathname.split('/').pop();
    await loadCategory(categoryId, token);
});

async function loadCategory(categoryId, token) {
    try {
        const response = await fetch(`/api/categories/${categoryId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load category');
        }

        const category = await response.json();
        
        // Display category name
        document.getElementById('categoryName').textContent = category.name;
        
        // Display notes
        displayCategoryNotes(category.notes || []);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load category');
    }
}

function displayCategoryNotes(notes) {
    const notesContainer = document.getElementById('categoryNotes');
    
    if (!notes.length) {
        notesContainer.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">No notes in this category yet.</p>
            </div>
        `;
        return;
    }

    notesContainer.innerHTML = notes.map(note => `
        <div class="col-md-4 mb-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${note.title}</h5>
                    <p class="card-text text-muted small">
                        ${new Date(note.created_at).toLocaleDateString()}
                    </p>
                    <p class="card-text">${note.summary || 'No summary available'}</p>
                    <a href="/notes/${note.id}" class="btn btn-outline-primary btn-sm">View</a>
                </div>
            </div>
        </div>
    `).join('');
}