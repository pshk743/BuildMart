class CartManager {
    constructor() {
        this.cart = this.loadCart();
        this.products = [];
        this.promoCode = null;
        this.discount = 0;
        this.template = document.getElementById('cart-item-template');
    }

    async loadProducts() {
        try {
            const response = await fetch('data/products.json');
            this.products = await response.json();
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    loadCart() {
        return JSON.parse(localStorage.getItem('cart')) || [];
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    getProductById(id) {
        return this.products.find(p => p.id === id);
    }

    updateQuantity(productId, newQuantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                const itemElement = document.querySelector(`[data-product-id="${productId}"]`);
                if (itemElement) {
                    itemElement.style.transition = 'all 0.3s ease-out';
                    itemElement.style.opacity = '0';
                    itemElement.style.transform = 'translateX(-20px)';
                    setTimeout(() => {
                        this.removeItem(productId);
                    }, 300);
                } else {
                    this.removeItem(productId);
                }
            } else {
                item.quantity = newQuantity;
                this.saveCart();
                this.render();
            }
        }
    }

    removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.render();
    }

    calculateTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmount = subtotal * this.discount;
        const subtotalAfterDiscount = subtotal - discountAmount;
        const tax = subtotalAfterDiscount * 0.08;
        const total = subtotalAfterDiscount + tax;
        
        return { subtotal, discountAmount, tax, total };
    }

    applyPromoCode(code) {
        if (this.promoCode) {
            return false;
        }

        const validCodes = {
            'SAVE10': 0.10
        };

        const upperCode = code.trim().toUpperCase();
        
        if (validCodes[upperCode]) {
            this.promoCode = upperCode;
            this.discount = validCodes[upperCode];
            this.updateTotals();
            this.showPromoMessage(`✓ Promo code applied! You saved ${(this.discount * 100).toFixed(0)}%`, 'success');
            this.hidePromoHint();
            return true;
        } else {
            this.showPromoHint();
            return false;
        }
    }

    showPromoHint() {
        let hint = document.querySelector('.promo-hint');
        if (!hint) {
            hint = document.createElement('p');
            hint.className = 'promo-hint';
            hint.textContent = 'Try code: SAVE10 for 10% off';
            
            const promoSection = document.querySelector('.promo-section');
            promoSection.appendChild(hint);
            
            setTimeout(() => {
                hint.style.opacity = '1';
            }, 10);
        }
    }

    hidePromoHint() {
        const hint = document.querySelector('.promo-hint');
        if (hint) {
            hint.style.opacity = '0';
            setTimeout(() => {
                hint.remove();
            }, 300);
        }
    }

    showPromoMessage(message, type) {
        const existingMessage = document.querySelector('.promo-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `promo-message promo-message-${type}`;
        messageDiv.textContent = message;
        
        const promoForm = document.querySelector('.promo-form');
        promoForm.parentNode.insertBefore(messageDiv, promoForm.nextSibling);
        
        setTimeout(() => {
            messageDiv.classList.add('show');
        }, 10);
    }

    render() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const cartTitle = document.querySelector('.cart-title');
        const cartContent = document.querySelector('.cart-content');

        if (this.cart.length === 0) {
            if (cartTitle) cartTitle.style.display = 'none';
            cartContent.innerHTML = `
                <div style="text-align: center; padding: 80px 20px; min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; grid-column: 1 / -1;">
                    <h1 style="font-size: 32px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px 0;">Your Cart is Empty</h1>
                    <p style="font-size: 16px; color: #666; margin: 0 0 32px 0;">Start shopping to add items to your cart</p>
                    <button onclick="window.location.href='index.html'" style="padding: 14px 32px; background-color: #FF5722; color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background-color 0.2s;">
                        Browse Products →
                    </button>
                </div>
            `;
            return;
        }

        cartItemsContainer.innerHTML = '';
        
        this.cart.forEach(item => {
            const itemElement = this.createCartItemElement(item);
            cartItemsContainer.appendChild(itemElement);
        });

        this.updateTotals();
        this.updateCartBadge();
    }

    createCartItemElement(item) {
        const clone = this.template.content.cloneNode(true);
        const cartItem = clone.querySelector('.cart-item');
        
        cartItem.dataset.productId = item.id;
        
        const itemTotal = (item.price * item.quantity).toFixed(2);
        
        clone.querySelector('.item-image img').src = item.image;
        clone.querySelector('.item-image img').alt = item.title;
        clone.querySelector('.item-name').textContent = item.title;
        clone.querySelector('.item-category').textContent = item.category;
        clone.querySelector('.item-price').textContent = `$${item.price.toFixed(2)}`;
        clone.querySelector('.qty-value').textContent = item.quantity;
        clone.querySelector('.item-total').textContent = `$${itemTotal}`;

        const decreaseBtn = clone.querySelector('.qty-decrease');
        const increaseBtn = clone.querySelector('.qty-increase');
        const deleteBtn = clone.querySelector('.delete-btn');

        decreaseBtn.addEventListener('click', () => {
            this.updateQuantity(item.id, item.quantity - 1);
        });

        increaseBtn.addEventListener('click', () => {
            this.updateQuantity(item.id, item.quantity + 1);
        });

        deleteBtn.addEventListener('click', () => {
            cartItem.style.transition = 'all 0.3s ease-out';
            cartItem.style.opacity = '0';
            cartItem.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                this.removeItem(item.id);
            }, 300);
        });

        return clone;
    }

    updateTotals() {
        const { subtotal, discountAmount, tax, total } = this.calculateTotals();
        
        const summaryContainer = document.querySelector('.order-summary');
        
        let summaryHTML = '<h2 class="summary-title">Order Summary</h2>';
        
        summaryHTML += `
            <div class="summary-row">
                <span class="summary-label">Subtotal</span>
                <span class="summary-value">$${subtotal.toFixed(2)}</span>
            </div>
            
            <div class="summary-row">
                <span class="summary-label">Tax (8%)</span>
                <span class="summary-value">$${tax.toFixed(2)}</span>
            </div>
        `;
        
        if (this.discount > 0) {
            summaryHTML += `
                <div class="summary-row summary-discount">
                    <span class="summary-label">Discount (10%)</span>
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
        
        const continueShoppingBtn = summaryContainer.querySelector('.continue-shopping-btn');
        continueShoppingBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    updateCartBadge() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        let badge = document.querySelector('.cart-badge');
        const cartBtn = document.querySelector('.cart-btn');
        
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

document.addEventListener('DOMContentLoaded', async () => {
    const cartManager = new CartManager();
    await cartManager.loadProducts();
    cartManager.render();

    const promoBtn = document.querySelector('.promo-btn');
    const promoInput = document.querySelector('.promo-input');
    
    if (promoBtn && promoInput) {
        promoInput.addEventListener('input', (e) => {
            const code = e.target.value.trim().toUpperCase();
            const validCodes = ['SAVE10'];
            
            if (code.length > 0 && !validCodes.includes(code)) {
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

    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }
});
