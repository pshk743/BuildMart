document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('auth-form');
    if (!form) {
        return;
    }

    const mode = form.dataset.mode;
    const errorBox = document.getElementById('auth-error');
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || 'index.html';

    if (Api.isLoggedIn()) {
        window.location.href = next;
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorBox.classList.remove('show');
        errorBox.textContent = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const path = mode === 'register' ? '/api/auth/register' : '/api/auth/login';

        try {
            const data = await Api.apiFetch(path, {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            Api.setToken(data.token);
            window.dispatchEvent(new Event('auth:changed'));
            window.location.href = next;
        } catch (error) {
            errorBox.textContent = error.message || 'Authentication failed';
            errorBox.classList.add('show');
        }
    });
});
