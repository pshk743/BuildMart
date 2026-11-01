window.Api = (() => {
    const TOKEN_KEY = 'token';

    function getBaseUrl() {
        return (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:8080';
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function setToken(token) {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    }

    function isLoggedIn() {
        return Boolean(getToken());
    }

    function logout() {
        setToken(null);
        window.dispatchEvent(new Event('auth:changed'));
    }

    function requireAuth(nextUrl) {
        if (isLoggedIn()) {
            return true;
        }
        const next = encodeURIComponent(nextUrl || window.location.href);
        window.location.href = `login.html?next=${next}`;
        return false;
    }

    function productImage(product) {
        if (!product || !Array.isArray(product.images) || product.images.length === 0) {
            return '';
        }
        return product.images[0];
    }

    async function apiFetch(path, options = {}) {
        const headers = new Headers(options.headers || {});
        if (!headers.has('Content-Type') && options.body) {
            headers.set('Content-Type', 'application/json');
        }

        const token = getToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        const response = await fetch(`${getBaseUrl()}${path}`, {
            ...options,
            headers
        });

        if (response.status === 401 || (response.status === 403 && token && !path.startsWith('/api/auth/'))) {
            logout();
            if (!path.startsWith('/api/auth/')) {
                requireAuth(window.location.href);
            }
            const error = await safeJson(response);
            throw new Error((error && error.message) || 'Unauthorized');
        }

        if (response.status === 204) {
            return null;
        }

        const data = await safeJson(response);
        if (!response.ok) {
            const message = (data && (data.detail || data.message)) || `Request failed (${response.status})`;
            throw new Error(message);
        }
        return data;
    }

    async function safeJson(response) {
        try {
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    return {
        setToken,
        isLoggedIn,
        logout,
        requireAuth,
        productImage,
        apiFetch
    };
})();
