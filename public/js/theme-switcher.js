document.addEventListener('DOMContentLoaded', () => {
    const themeToggles = [
        document.getElementById('themeToggle'),
        document.getElementById('themeToggleMobile')
    ];
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = (isDark) => {
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.removeItem('theme');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
        
        // Update theme toggle icons
        themeToggles.forEach(toggle => {
            if (toggle) {
                // Note: We flip the visibility logic since we swapped the icons
                toggle.querySelector('.dark-icon').style.display = isDark ? 'block' : 'none';
                toggle.querySelector('.light-icon').style.display = isDark ? 'none' : 'block';
            }
        });
    };

    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        updateTheme(false);
    } else if (!savedTheme && !prefersDark.matches) {
        updateTheme(false);
    } else {
        updateTheme(true);
    }

    // Add click handlers to both buttons
    themeToggles.forEach(toggle => {
        if (toggle) {
            toggle.addEventListener('click', () => {
                const isCurrentlyDark = !document.documentElement.hasAttribute('data-theme');
                updateTheme(!isCurrentlyDark);
            });
        }
    });

    // System theme change handler
    prefersDark.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            updateTheme(e.matches);
        }
    });
});