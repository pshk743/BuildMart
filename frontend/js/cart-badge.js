class CartBadgeManager {
    constructor() {
        this.init();
    }

    init() {
        this.updateBadge();
        window.addEventListener('cart:updated', () => this.updateBadge());
        window.addEventListener('auth:changed', () => this.updateBadge());
        window.addEventListener('header:ready', () => this.updateBadge());
    }

    async updateBadge() {
        const cartBtn = document.querySelector('.cart-btn');
        if (!cartBtn) {
            return;
        }

        let totalItems = 0;

        if (Api.isLoggedIn()) {
            try {
                const cart = await Api.apiFetch('/api/cart');
                totalItems = (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            } catch (error) {
                console.error('Failed to load cart badge:', error);
                totalItems = 0;
            }
        }

        let badge = document.querySelector('.cart-badge');
        if (totalItems > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'cart-badge';
                cartBtn.style.position = 'relative';
                cartBtn.appendChild(badge);
            }
            badge.textContent = String(totalItems);
        } else if (badge) {
            badge.remove();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CartBadgeManager();
});
