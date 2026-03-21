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

document.addEventListener('DOMContentLoaded', () => {
    loadComponent('header-placeholder', 'components/header.html');
    loadComponent('footer-placeholder', 'components/footer.html');
});