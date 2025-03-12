class ProfileManager {
    constructor() {
        this.init();
        this.originalData = null;
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

            this.originalData = profile;
            this.updateDisplay(profile, stats);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    updateDisplay(profile, stats) {
        // Update profile info
        document.getElementById('displayUsername').textContent = profile.username;
        document.getElementById('displayEmail').textContent = profile.email;
        document.getElementById('username').value = profile.username;
        document.getElementById('email').value = profile.email;

        // Update stats
        document.getElementById('notesCount').textContent = stats.notes;
        document.getElementById('categoriesCount').textContent = stats.categories;
        document.getElementById('tagsCount').textContent = stats.tags;
    }

    setupEventListeners() {
        // Password toggle
        document.getElementById('togglePassword').addEventListener('click', () => {
            const fields = document.getElementById('passwordFields');
            fields.style.display = fields.style.display === 'none' ? 'block' : 'none';
        });

        // Form submission
        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveChanges();
        });

        // Cancel changes
        document.getElementById('cancelChanges').addEventListener('click', () => {
            this.resetForm();
        });

        // Delete account
        document.getElementById('deleteAccount').addEventListener('click', () => {
            this.confirmDelete();
        });
    }

    async saveChanges() {
        try {
            const username = document.getElementById('username').value;
            const currentPassword = document.getElementById('currentPassword')?.value;
            const newPassword = document.getElementById('newPassword')?.value;

            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: username.trim(),
                    currentPassword,
                    newPassword
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update profile');
            }

            // Update localStorage user data
            const user = JSON.parse(localStorage.getItem('user'));
            user.username = username.trim();
            localStorage.setItem('user', JSON.stringify(user));

            this.showSuccess();
            await this.loadUserData();
            this.resetPasswordFields();
        } catch (error) {
            this.showError(error.message);
        }
    }

    resetForm() {
        document.getElementById('username').value = this.originalData.username;
        this.resetPasswordFields();
    }

    resetPasswordFields() {
        document.getElementById('passwordFields').style.display = 'none';
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
    }

    showSuccess() {
        const indicator = document.getElementById('saveIndicator');
        indicator.style.display = 'flex';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 3000);
    }

    showError(message) {
        // You can enhance this with a proper error display
        alert(message);
    }

    async confirmDelete() {
        const confirmed = confirm(
            'Are you sure you want to delete your account? This action cannot be undone and will delete all your notes, categories, and data.'
        );

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/profile', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete account');

            // Clear local storage and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/auth/login';
        } catch (error) {
            this.showError(error.message);
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});