document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth/login';
        return;
    }

    await loadCategories(token);
    setupEventListeners(token);
});

async function loadCategories(token) {
    try {
        const response = await fetch('/api/categories', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }

        const categories = await response.json();
        displayCategories(categories);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load categories');
    }
}

function displayCategories(categories) {
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = categories.map(category => `
        <div class="col-md-4 mb-4">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${category.name}</h5>
                    <div class="mt-3">
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="deleteCategory(${category.id})">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function setupEventListeners(token) {
    document.getElementById('createCategoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('categoryName').value;
        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            });

            if (!response.ok) {
                throw new Error('Failed to create category');
            }

            // Reload categories and reset form
            await loadCategories(token);
            document.getElementById('categoryName').value = '';
            bootstrap.Modal.getInstance(document.getElementById('createCategoryModal')).hide();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to create category');
        }
    });
}

async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) {
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        // Show success message with affected notes count
        if (data.affectedNotes > 0) {
            alert(`Category deleted successfully. ${data.affectedNotes} note(s) have been uncategorized.`);
        } else {
            alert('Category deleted successfully.');
        }

        await loadCategories(token);
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Failed to delete category');
    }
}