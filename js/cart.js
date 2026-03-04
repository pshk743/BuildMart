class CartManager {
    constructor() {
        this.cart = this.loadCart();
        this.products = [];
        this.promoCode = null;
        this.discount = 0;
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
        // Если промокод уже применен, ничего не делаем
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
            // При неверном промокоде показываем подсказку
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

        // Сообщение остается и не исчезает автоматически
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
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.dataset.productId = item.id;
        
        const itemTotal = (item.price * item.quantity).toFixed(2);
        
        div.innerHTML = `
            <div class="item-product">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.title}">
                </div>
                <div class="item-info">
                    <h3 class="item-name">${item.title}</h3>
                    <p class="item-category">${item.category}</p>
                </div>
            </div>
            <div class="item-price">$${item.price.toFixed(2)}</div>
            <div class="item-quantity">
                <button class="qty-btn qty-decrease">−</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn qty-increase">+</button>
            </div>
            <div class="item-total">$${itemTotal}</div>
            <button class="delete-btn">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 4H14M6.5 7V11M9.5 7V11M3 4L4 13C4 13.5304 4.21071 14.0391 4.58579 14.4142C4.96086 14.7893 5.46957 15 6 15H10C10.5304 15 11.0391 14.7893 11.4142 14.4142C11.7893 14.0391 12 13.5304 12 13L13 4M5.5 4V3C5.5 2.73478 5.60536 2.48043 5.79289 2.29289C5.98043 2.10536 6.23478 2 6.5 2H9.5C9.76522 2 10.0196 2.10536 10.2071 2.29289C10.3946 2.48043 10.5 2.73478 10.5 3V4" stroke="#EF4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;

        const decreaseBtn = div.querySelector('.qty-decrease');
        const increaseBtn = div.querySelector('.qty-increase');
        const deleteBtn = div.querySelector('.delete-btn');

        decreaseBtn.addEventListener('click', () => {
            this.updateQuantity(item.id, item.quantity - 1);
        });

        increaseBtn.addEventListener('click', () => {
            this.updateQuantity(item.id, item.quantity + 1);
        });

        deleteBtn.addEventListener('click', () => {
            div.style.transition = 'all 0.3s ease-out';
            div.style.opacity = '0';
            div.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                this.removeItem(item.id);
            }, 300);
        });

        return div;
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
        // Проверка при вводе текста
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
