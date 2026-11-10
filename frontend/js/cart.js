class CartManager {
    constructor() {
        this.cart = null;
        this.template = document.getElementById('cart-item-template');
    }

    async loadCart() {
        if (!Api.requireAuth('cart.html')) {
            return;
        }

        try {
            this.cart = await Api.apiFetch('/api/cart');
            this.render();
            window.dispatchEvent(new Event('cart:updated'));
        } catch (error) {
            console.error('Error loading cart:', error);
            alert(error.message || 'Failed to load cart');
        }
    }

    async updateQuantity(itemId, newQuantity) {
        if (newQuantity <= 0) {
            await this.removeItem(itemId);
            return;
        }

        try {
            this.cart = await Api.apiFetch(`/api/cart/items/${itemId}`, {
                method: 'PATCH',
                body: JSON.stringify({ quantity: newQuantity })
            });
            this.render();
            window.dispatchEvent(new Event('cart:updated'));
        } catch (error) {
            alert(error.message || 'Failed to update quantity');
            await this.loadCart();
        }
    }

    async removeItem(itemId) {
        try {
            await Api.apiFetch(`/api/cart/items/${itemId}`, { method: 'DELETE' });
            await this.loadCart();
        } catch (error) {
            alert(error.message || 'Failed to remove item');
        }
    }

    async applyPromoCode(code) {
        try {
            this.cart = await Api.apiFetch('/api/cart/apply-promo', {
                method: 'POST',
                body: JSON.stringify({ code })
            });
            this.render();
            this.showPromoMessage(
                `✓ Promo code applied! You saved ${this.cart.discountPercentage}%`,
                'success'
            );
            this.hidePromoHint();
            return true;
        } catch (error) {
            this.showPromoHint();
            this.showPromoMessage(error.message || 'Invalid promo code', 'error');
            return false;
        }
    }

    showPromoHint() {
        let hint = document.querySelector('.promo-hint');
        if (!hint) {
            hint = document.createElement('p');
            hint.className = 'promo-hint';
            hint.textContent = 'Try code: SAVE10 for 10% off';
            document.querySelector('.promo-section').appendChild(hint);
            setTimeout(() => {
                hint.style.opacity = '1';
            }, 10);
        }
    }

    hidePromoHint() {
        const hint = document.querySelector('.promo-hint');
        if (hint) {
            hint.style.opacity = '0';
            setTimeout(() => hint.remove(), 300);
        }
    }

    showPromoMessage(message, type) {
        this.clearPromoMessage();

        const messageDiv = document.createElement('div');
        messageDiv.className = `promo-message promo-message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.color = type === 'error' ? '#dc2626' : '#15803d';

        const promoForm = document.querySelector('.promo-form');
        promoForm.parentNode.insertBefore(messageDiv, promoForm.nextSibling);
        setTimeout(() => messageDiv.classList.add('show'), 10);
    }

    clearPromoMessage() {
        const existingMessage = document.querySelector('.promo-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    render() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const cartTitle = document.querySelector('.cart-title');
        const cartContent = document.querySelector('.cart-content');
        const items = (this.cart && this.cart.items) || [];

        if (items.length === 0) {
            if (cartTitle) {
                cartTitle.style.display = 'none';
            }
            cartContent.innerHTML = `
                <div style="text-align: center; padding: 20px 20px 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; grid-column: 1 / -1;">
                    <h1 style="font-size: 30px; font-weight: 700; color: #101828; margin: 0 0 12px 0; line-height: 36px;">Your Cart is Empty</h1>
                    <p style="font-size: 16px; color: #666; margin: 0 0 32px 0;">Start shopping to add items to your cart</p>
                    <button onclick="window.location.href='index.html'" style="padding: 14px 32px; background-color: #F54900; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; display: flex; align-items: center; gap: 8px; font-family: 'Inter', sans-serif;">
                        Browse Products
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;
            return;
        }

        if (cartTitle) {
            cartTitle.style.display = '';
        }

        cartItemsContainer.innerHTML = '';
        items.forEach((item) => {
            cartItemsContainer.appendChild(this.createCartItemElement(item));
        });
        this.updateTotals();
    }

    createCartItemElement(item) {
        const clone = this.template.content.cloneNode(true);
        const cartItem = clone.querySelector('.cart-item');
        cartItem.dataset.itemId = item.id;

        const itemTotal = Number(item.lineTotal ?? (Number(item.price) * Number(item.quantity))).toFixed(2);

        clone.querySelector('.item-image img').src = item.image || '';
        clone.querySelector('.item-image img').alt = item.title;
        clone.querySelector('.item-name').textContent = item.title;
        clone.querySelector('.item-category').textContent = '';
        clone.querySelector('.item-price').textContent = `$${Number(item.price).toFixed(2)}`;
        clone.querySelector('.qty-value').textContent = item.quantity;
        clone.querySelector('.item-total').textContent = `$${itemTotal}`;

        clone.querySelector('.qty-decrease').addEventListener('click', () => {
            this.updateQuantity(item.id, item.quantity - 1);
        });
        clone.querySelector('.qty-increase').addEventListener('click', () => {
            this.updateQuantity(item.id, item.quantity + 1);
        });
        clone.querySelector('.delete-btn').addEventListener('click', () => {
            cartItem.style.transition = 'all 0.3s ease-out';
            cartItem.style.opacity = '0';
            cartItem.style.transform = 'translateX(-20px)';
            setTimeout(() => this.removeItem(item.id), 300);
        });

        return clone;
    }

    updateTotals() {
        const summaryContainer = document.querySelector('.order-summary');
        if (!summaryContainer || !this.cart) {
            return;
        }

        const subtotal = Number(this.cart.subtotal || 0);
        const discountAmount = Number(this.cart.discountAmount || 0);
        const total = Number(this.cart.total || 0);
        const discountPercentage = this.cart.discountPercentage || 0;
        const hasDiscount = discountAmount > 0;

        let summaryHTML = '<h2 class="summary-title">Order Summary</h2>';
        summaryHTML += `
            <div class="summary-row">
                <span class="summary-label">Subtotal</span>
                <span class="summary-value">$${subtotal.toFixed(2)}</span>
            </div>
        `;

        if (hasDiscount) {
            summaryHTML += `
                <div class="summary-row summary-discount">
                    <span class="summary-label">Discount (${discountPercentage}%)</span>
                    <span class="summary-value">-$${discountAmount.toFixed(2)}</span>
                </div>
            `;
        }

        summaryHTML += `
            <div class="summary-divider"></div>
            <div class="summary-row summary-total">
                <span class="summary-label">Total</span>
                <span class="summary-value">$${total.toFixed(2)}</span>
            </div>
            <button class="checkout-btn">Proceed to Checkout →</button>
            <button class="continue-shopping-btn">Continue Shopping</button>
        `;

        summaryContainer.innerHTML = summaryHTML;
        summaryContainer.querySelector('.continue-shopping-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const cartManager = new CartManager();
    await cartManager.loadCart();

    const promoBtn = document.querySelector('.promo-btn');
    const promoInput = document.querySelector('.promo-input');

    if (promoBtn && promoInput) {
        promoInput.addEventListener('input', (e) => {
            cartManager.clearPromoMessage();
            const code = e.target.value.trim().toUpperCase();
            if (code.length > 0 && code !== 'SAVE10') {
                cartManager.showPromoHint();
            } else {
                cartManager.hidePromoHint();
            }
        });

        promoBtn.addEventListener('click', () => {
            const code = promoInput.value;
            if (code) {
                cartManager.applyPromoCode(code);
            }
        });

        promoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                promoBtn.click();
            }
        });
    }
});
