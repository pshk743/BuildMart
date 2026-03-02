document.addEventListener('DOMContentLoaded', function() {
    const cartItems = document.querySelectorAll('.cart-item');
    const shippingInfo = document.querySelector('.shipping-info');
    
    cartItems.forEach(item => {
        const deleteBtn = item.querySelector('.delete-btn');
        const qtyBtns = item.querySelectorAll('.qty-btn');
        const qtyValue = item.querySelector('.qty-value');
        const itemPrice = parseFloat(item.querySelector('.item-price').textContent.replace('$', ''));
        const itemTotal = item.querySelector('.item-total');

        deleteBtn.addEventListener('click', function() {
            if (shippingInfo) {
                shippingInfo.style.transform = 'translateY(-20px)';
                shippingInfo.style.opacity = '0';
            }

            item.style.transition = 'all 0.3s ease-out';
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                item.remove();
                updateCartTotals();

                if (shippingInfo) {
                    setTimeout(() => {
                        shippingInfo.style.transform = 'translateY(0)';
                        shippingInfo.style.opacity = '1';
                    }, 50);
                }
            }, 300);
        });

        qtyBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                let currentQty = parseInt(qtyValue.textContent);
                
                if (btn.textContent === '+') {
                    currentQty++;
                } else if (btn.textContent === '−' && currentQty > 1) {
                    currentQty--;
                }
                
                qtyValue.textContent = currentQty;
                const newTotal = (itemPrice * currentQty).toFixed(2);
                itemTotal.textContent = '$' + newTotal;
                
                updateCartTotals();
            });
        });
    });
    
    function updateCartTotals() {
        const remainingItems = document.querySelectorAll('.cart-item');

        if (remainingItems.length === 0) {
            showEmptyCart();
            return;
        }
        
        let subtotal = 0;
        
        remainingItems.forEach(item => {
            const total = parseFloat(item.querySelector('.item-total').textContent.replace('$', ''));
            subtotal += total;
        });
        
        const tax = subtotal * 0.08;
        const total = subtotal + tax;
        
        document.querySelector('.summary-row:nth-child(2) .summary-value').textContent = '$' + subtotal.toFixed(2);
        document.querySelector('.summary-row:nth-child(3) .summary-value').textContent = '$' + tax.toFixed(2);
        document.querySelector('.summary-total .summary-value').textContent = '$' + total.toFixed(2);
    }
    
    function showEmptyCart() {
        const cartTitle = document.querySelector('.cart-title');
        if (cartTitle) {
            cartTitle.style.display = 'none';
        }

        const cartContent = document.querySelector('.cart-content');
        cartContent.innerHTML = `
            <div style="text-align: center; padding: 80px 20px; min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; grid-column: 1 / -1;">
                <h1 style="font-size: 32px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px 0;">Your Cart is Empty</h1>
                <p style="font-size: 16px; color: #666; margin: 0 0 32px 0;">Start shopping to add items to your cart</p>
                <button onclick="window.location.href='index.html'" style="padding: 14px 32px; background-color: #FF5722; color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background-color 0.2s;">
                    Browse Products →
                </button>
            </div>
        `;
    }
});
