class ProfileManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.setupEventListeners();
    }

    async loadUserData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/auth/login';
                return;
            }

            const [profileResponse, statsResponse] = await Promise.all([
                fetch('/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('/api/user/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!profileResponse.ok || !statsResponse.ok) {
                throw new Error('Failed to load user data');
            }

            const profile = await profileResponse.json();
            const stats = await statsResponse.json();

            this.updateDisplay(profile, stats);
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showError('Failed to load user data');
        }
    }

    updateDisplay(profile, stats) {
        // Update profile info
        document.getElementById('displayUsername').textContent = profile.username;
        document.getElementById('displayEmail').textContent = profile.email;
        document.getElementById('username').value = profile.username;
        document.getElementById('email').value = profile.email;
        document.getElementById('memberSince').textContent = new Date(profile.created_at).toLocaleDateString();

        // Update stats
        document.getElementById('notesCount').textContent = stats.notes || 0;
        document.getElementById('categoriesCount').textContent = stats.categories || 0;
        document.getElementById('tagsCount').textContent = stats.tags || 0;
        document.getElementById('linkedNotesCount').textContent = stats.linkedNotes || 0;
    }

    setupEventListeners() {
        // Profile form submission
        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateProfile();
        });

        // Password toggle
        document.getElementById('togglePassword').addEventListener('click', () => {
            const fields = document.getElementById('passwordFields');
            fields.style.display = fields.style.display === 'none' ? 'block' : 'none';
        });

        // Delete account
        document.getElementById('deleteAccount').addEventListener('click', () => {
            this.confirmDeleteAccount();
        });
    }

    async updateProfile() {
        try {
            const token = localStorage.getItem('token');
            const username = document.getElementById('username').value;
            const currentPassword = document.getElementById('currentPassword')?.value;
            const newPassword = document.getElementById('newPassword')?.value;

            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username,
                    currentPassword,
                    newPassword
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update profile');
            }

            await this.loadUserData();
            document.getElementById('passwordFields').style.display = 'none';
            this.showSuccess('Profile updated successfully');
        } catch (error) {
            console.error('Update profile error:', error);
            this.showError(error.message);
        }
    }

    async confirmDeleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your notes, categories, and data.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/profile', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete account');
            }

            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/auth/login';
        } catch (error) {
            console.error('Delete account error:', error);
            this.showError(error.message);
        }
    }

    showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.container').prepend(alert);
        setTimeout(() => alert.remove(), 3000);
    }

    showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.container').prepend(alert);
        setTimeout(() => alert.remove(), 3000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});