class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    init() {
        this.updateUI();
        this.setupEventListeners();
    }

    updateUI() {
        const isAuthenticated = !!this.token;
        
        document.querySelectorAll('.auth-required').forEach(el => {
            el.style.display = isAuthenticated ? 'flex' : 'none';
        });

        document.querySelectorAll('.guest-only').forEach(el => {
            el.style.display = isAuthenticated ? 'none' : 'flex';
        });

        if (isAuthenticated && this.user) {
            const usernameDisplay = document.getElementById('usernameDisplay');
            if (usernameDisplay) {
                usernameDisplay.textContent = this.user.username;
            }
        }
    }

    setupEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            this.token = data.token;
            this.user = data.user;
            
            window.location.href = '/notes';
        } catch (error) {
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;
        window.location.href = '/';
    }

    checkAuth() {
        if (!this.token) {
            window.location.href = '/auth/login';
            return false;
        }
        return true;
    }
}

// Create global instance
window.authManager = new AuthManager();