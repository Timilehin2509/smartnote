class NoteLinkManager {
    constructor(parentNoteId) {
        this.parentNoteId = parentNoteId;
        this.linkedNotes = [];
        this.availableNotes = [];
        this.token = localStorage.getItem('token');
    }

    async initialize() {
        // Check if button already exists
        if (document.getElementById('linkNotesBtn')) {
            console.warn('Link button already exists, skipping initialization');
            return;
        }

        const editBtn = document.querySelector('#editBtn');
        if (!editBtn) {
            console.error('Edit button not found');
            return;
        }

        // Add manage links button
        const linkButton = document.createElement('button');
        linkButton.id = 'linkNotesBtn';
        linkButton.className = 'btn btn-outline-primary me-2';
        linkButton.innerHTML = '<i class="bi bi-link-45deg"></i> Manage Links';
        editBtn.insertAdjacentElement('beforebegin', linkButton);

        // Add modal
        const modalHtml = `
            <div class="modal fade" id="linkNotesModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Manage Note Links</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <input type="text" class="form-control" id="noteLinkSearch" 
                                       placeholder="Search notes to link...">
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Available Notes</h6>
                                    <div id="availableNotes" class="list-group"></div>
                                </div>
                                <div class="col-md-6">
                                    <h6>Linked Notes</h6>
                                    <div id="linkedNotes" class="list-group"></div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="saveLinks">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Initialize modal and store reference
        this.modal = new bootstrap.Modal(document.getElementById('linkNotesModal'));
        
        this.setupEventListeners();
        await this.loadLinkedNotes();
    }

    setupEventListeners() {
        // Open modal
        document.getElementById('linkNotesBtn').addEventListener('click', () => {
            this.openLinkModal();
        });

        // Search functionality
        document.getElementById('noteLinkSearch').addEventListener('input', (e) => {
            this.searchNotes(e.target.value);
        });

        // Save changes
        document.getElementById('saveLinks').addEventListener('click', () => {
            this.saveLinks();
        });

        // Modal close handler
        document.getElementById('linkNotesModal').addEventListener('hidden.bs.modal', () => {
            this.refreshView();
        });
    }

    async loadLinkedNotes() {
        try {
            console.log('Loading linked notes');
            const response = await fetch(`/api/notes/${this.parentNoteId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const note = await response.json();
            console.log('Loaded note data with links:', note);
            this.linkedNotes = note.linkedNotes || [];
            this.displayLinkedNotes();
        } catch (error) {
            console.error('Error loading linked notes:', error);
            showError('Failed to load linked notes');
        }
    }

    async openLinkModal() {
        try {
            const response = await fetch('/api/notes', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const allNotes = await response.json();
            
            // Filter available notes
            this.availableNotes = allNotes.filter(note => 
                note.id !== parseInt(this.parentNoteId) && 
                !this.linkedNotes.some(linked => linked.id === note.id)
            );
            
            this.displayAvailableNotes(this.availableNotes);
            this.displayLinkedNotes();
            this.modal.show();
        } catch (error) {
            console.error('Error loading notes:', error);
            showError('Failed to load available notes');
        }
    }

    async searchNotes(query) {
        if (!query.trim()) {
            this.displayAvailableNotes(this.availableNotes);
            return;
        }

        const filteredNotes = this.availableNotes.filter(note =>
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            (note.content && note.content.toLowerCase().includes(query.toLowerCase()))
        );
        this.displayAvailableNotes(filteredNotes);
    }

    displayAvailableNotes(notes) {
        const container = document.getElementById('availableNotes');
        container.innerHTML = notes.length ? notes.map(note => `
            <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                 data-note-id="${note.id}">
                <div>
                    <h6 class="mb-1">${note.title}</h6>
                    <small class="text-muted">
                        ${note.category_name || 'Uncategorized'} • 
                        ${new Date(note.created_at).toLocaleDateString()}
                    </small>
                </div>
                <button class="btn btn-sm btn-outline-primary link-note-btn">
                    <i class="bi bi-link-45deg"></i>
                </button>
            </div>
        `).join('') : '<p class="text-muted m-3">No notes available</p>';

        // Add click handlers
        container.querySelectorAll('.link-note-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteElement = e.target.closest('.list-group-item');
                const noteId = parseInt(noteElement.dataset.noteId);
                const note = this.availableNotes.find(n => n.id === noteId);
                if (note) {
                    this.linkedNotes.push(note);
                    this.availableNotes = this.availableNotes.filter(n => n.id !== noteId);
                    this.displayLinkedNotes();
                    this.displayAvailableNotes(this.availableNotes);
                }
            });
        });
    }

    displayLinkedNotes() {
        const container = document.getElementById('linkedNotes');
        container.innerHTML = this.linkedNotes.length ? this.linkedNotes.map(note => `
            <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                 data-note-id="${note.id}">
                <div>
                    <h6 class="mb-1">${note.title}</h6>
                    <small class="text-muted">
                        ${note.category_name || 'Uncategorized'} • 
                        ${new Date(note.created_at).toLocaleDateString()}
                    </small>
                </div>
                <button class="btn btn-sm btn-outline-danger unlink-note-btn">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        `).join('') : '<p class="text-muted m-3">No linked notes</p>';

        // Add click handlers
        container.querySelectorAll('.unlink-note-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteElement = e.target.closest('.list-group-item');
                const noteId = parseInt(noteElement.dataset.noteId);
                const note = this.linkedNotes.find(n => n.id === noteId);
                if (note) {
                    this.availableNotes.push(note);
                    this.linkedNotes = this.linkedNotes.filter(n => n.id !== noteId);
                    this.displayLinkedNotes();
                    this.displayAvailableNotes(this.availableNotes);
                }
            });
        });
    }

    async saveLinks() {
        const saveBtn = document.getElementById('saveLinks');
        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';

            const response = await fetch(`/api/notes/${this.parentNoteId}/links`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    linkedNoteIds: this.linkedNotes.map(note => note.id)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update links');
            }

            const result = await response.json();
            this.linkedNotes = result.linkedNotes || [];
            
            // Hide modal and update view
            this.modal.hide();
            await this.refreshView();
            showError('Links updated successfully', true);
        } catch (error) {
            console.error('Error saving links:', error);
            showError(error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    }

    async refreshView() {
        await this.loadLinkedNotes();
        
        // Update the main note view's linked notes display
        const linkedNotesDisplay = document.getElementById('linkedNotesDisplay');
        if (linkedNotesDisplay) {
            linkedNotesDisplay.innerHTML = this.linkedNotes.length ? this.linkedNotes.map(note => `
                <a href="/notes/${note.id}" class="text-decoration-none">
                    <div class="linked-note-card ${note.link_type}">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0">
                                ${note.link_type === 'incoming' ? '← ' : '→ '}
                                ${note.title}
                            </h6>
                            <span class="badge bg-${note.link_type === 'incoming' ? 'success' : 'primary'}">
                                ${note.link_type}
                            </span>
                        </div>
                        <p class="small text-muted mb-0">
                            ${note.category_name || 'Uncategorized'} • 
                            ${new Date(note.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </a>
            `).join('') : '<p class="text-muted">No linked notes</p>';
        }
    }
}

// Initialize the link manager in view-note.js
document.addEventListener('DOMContentLoaded', () => {
    const noteId = window.location.pathname.split('/').pop();
    const linkManager = new NoteLinkManager(noteId);
    linkManager.initialize();
});