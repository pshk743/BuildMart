class CartBadgeManager {
    constructor() {
        this.init();
    }

    init() {
        this.updateBadge();

        window.addEventListener('storage', () => {
            this.updateBadge();
        });

        document.addEventListener('cartUpdated', () => {
            this.updateBadge();
        });
    }

    updateBadge() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        let badge = document.querySelector('.cart-badge');
        const cartBtn = document.querySelector('.cart-btn');
        
        if (!cartBtn) return;
        
        if (totalItems > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'cart-badge';
                cartBtn.style.position = 'relative';
                cartBtn.appendChild(badge);
            }
            badge.textContent = totalItems;
        } else if (badge) {
            badge.remove();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }
});
