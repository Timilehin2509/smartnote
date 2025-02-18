document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth/login';
        return;
    }

    try {
        const response = await fetch('/api/notes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch notes');
        }

        const notes = await response.json();
        displayNotes(notes);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load notes');
    }
});

function displayNotes(notes) {
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = notes.map(note => `
        <div class="col-md-4 mb-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${note.title}</h5>
                    <p class="card-text text-muted small">
                        ${new Date(note.created_at).toLocaleDateString()}
                    </p>
                    <p class="card-text">${note.summary || 'No summary available'}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <a href="/notes/${note.id}" class="btn btn-outline-primary btn-sm">View</a>
                        <div class="badge bg-secondary">
                            ${note.category_name || 'Uncategorized'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}