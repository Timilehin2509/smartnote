document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        document.querySelector('.search-container').style.display = 'none';
        return;
    }

    const searchInput = document.getElementById('globalSearch');
    const searchResults = document.getElementById('searchResults');
    const searchOptions = document.getElementById('searchOptions');
    const searchFilters = document.getElementById('searchFilters');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(e.target.value), 300);
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value) {
            searchResults.style.display = 'block';
        }
    });

    searchOptions.addEventListener('click', (e) => {
        e.stopPropagation();
        searchFilters.style.display = 
            searchFilters.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
            searchFilters.style.display = 'none';
        }
    });
});

async function performSearch(query) {
    if (!query) {
        document.getElementById('searchResults').style.display = 'none';
        return;
    }

    const searchNotes = document.getElementById('searchNotes').checked;
    const searchCategories = document.getElementById('searchCategories').checked;
    const searchTags = document.getElementById('searchTags').checked;

    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
            query,
            searchNotes: searchNotes.toString(),
            searchCategories: searchCategories.toString(),
            searchTags: searchTags.toString()
        });

        const response = await fetch(`/api/search?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Search failed');
        
        const results = await response.json();
        displaySearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.style.display = 'block';

    if (!results.length) {
        resultsContainer.innerHTML = '<div class="p-3 text-center text-muted">No results found</div>';
        return;
    }

    resultsContainer.innerHTML = results.map(result => `
        <div class="search-result-item" onclick="navigateToResult('${result.type}', ${result.id})">
            <div class="d-flex justify-content-between align-items-center">
                <strong>${result.title}</strong>
                <span class="badge" data-type="${result.type}">${result.type}</span>            </div>
            ${result.summary ? `<small class="text-muted">${result.summary}</small>` : ''}
        </div>
    `).join('');
}

function navigateToResult(type, id) {
    switch (type) {
        case 'note':
            window.location.href = `/notes/${id}`;
            break;
        case 'category':
            window.location.href = `/categories/${id}`;
            break;
    }
}