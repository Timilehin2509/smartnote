document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Function to update theme
    const updateTheme = (isDark) => {
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.removeItem('theme');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    };

    // Initialize theme based on localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        updateTheme(false);
    } else if (!savedTheme && !prefersDark.matches) {
        updateTheme(false);
    }

    // Theme toggle button click handler
    themeToggle.addEventListener('click', () => {
        const isCurrentlyDark = !document.documentElement.hasAttribute('data-theme');
        updateTheme(!isCurrentlyDark);
    });

    // Listen for system theme changes
    prefersDark.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            updateTheme(e.matches);
        }
    });
});