document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();

    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isAuthenticated = !!token;

    // Toggle body class for auth state
    document.body.classList.toggle('authenticated', isAuthenticated);

    // Update username if logged in
    if (isAuthenticated && user) {
        const usernameDisplay = document.getElementById('usernameDisplay');
        if (usernameDisplay) {
            usernameDisplay.textContent = user.username;
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/notes';
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message || 'Login failed');
    }
}

async function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.body.classList.remove('authenticated');
    window.location.replace('/auth/login');
}

// Add utility functions for auth state checks
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
}