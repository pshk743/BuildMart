async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;

        if (elementId === 'header-placeholder') {
            if (typeof initMobileMenu === 'function') {
                initMobileMenu();
            }
            initAuthControls();
            window.dispatchEvent(new Event('header:ready'));
        }
    } catch (error) {
        console.error(`Error loading component ${componentPath}:`, error);
    }
}

const AUTH_ICON_LOGIN = `
    <svg class="auth-icon-login" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="14" cy="14" r="13" fill="#F54900"/>
        <circle cx="14" cy="11" r="4.2" fill="#ffffff"/>
        <path d="M6.5 22.5C7.8 18.9 10.6 16.8 14 16.8C17.4 16.8 20.2 18.9 21.5 22.5" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
    </svg>
`;

const AUTH_ICON_LOGOUT = `
    <svg class="auth-icon-logout" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="14" cy="14" r="13" fill="#2F3E4E"/>
        <path d="M12 9H9.5C8.7 9 8 9.7 8 10.5V17.5C8 18.3 8.7 19 9.5 19H12" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M16 18L21 14L16 10" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 14H12" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
`;

function initAuthControls() {
    const button = document.getElementById('authActionBtn');
    if (!button || typeof Api === 'undefined') {
        return;
    }

    const sync = () => {
        if (Api.isLoggedIn()) {
            button.innerHTML = AUTH_ICON_LOGOUT;
            button.setAttribute('aria-label', 'Logout');
            button.title = 'Logout';
            button.onclick = () => {
                Api.logout();
                window.location.href = 'index.html';
            };
        } else {
            button.innerHTML = AUTH_ICON_LOGIN;
            button.setAttribute('aria-label', 'Login');
            button.title = 'Login';
            button.onclick = () => {
                window.location.href = 'login.html';
            };
        }
    };

    sync();
    window.addEventListener('auth:changed', sync);
}

document.addEventListener('DOMContentLoaded', () => {
    loadComponent('header-placeholder', 'components/header.html');
    loadComponent('footer-placeholder', 'components/footer.html');
});
