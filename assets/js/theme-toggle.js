document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('theme-toggle');
    const toggleIcon = document.getElementById('theme-toggle-icon');

    const updateToggleIcon = () => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    if (currentTheme === 'light') {
        toggleIcon.textContent = '○';
    } else if (currentTheme === 'dark') {
        toggleIcon.textContent = '●';
    } else {
        // System preference
        toggleIcon.textContent = isDark ? '●' : '○';
    }
};


    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    updateToggleIcon();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (!localStorage.getItem('theme')) {
            updateToggleIcon();
        }
    });

    toggleButton.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let newTheme;
        if (!currentTheme) {

            newTheme = systemDark ? 'light' : 'dark';
        } else {

            newTheme = null;
            document.documentElement.removeAttribute('data-theme');
        }
        
        if (newTheme) {
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        } else {
            localStorage.removeItem('theme');
        }
        
        updateToggleIcon();
    });
});
