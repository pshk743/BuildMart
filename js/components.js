async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;

        if (elementId === 'header-placeholder' && typeof initMobileMenu === 'function') {
            initMobileMenu();
        }
    } catch (error) {
        console.error(`Error loading component ${componentPath}:`, error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadComponent('header-placeholder', 'components/header.html');
    await loadComponent('footer-placeholder', 'components/footer.html');
    
    if (typeof CartBadgeManager !== 'undefined') {
        new CartBadgeManager();
    }
});