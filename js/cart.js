// Cart functionality with animations
document.addEventListener('DOMContentLoaded', function() {
    const cartItems = document.querySelectorAll('.cart-item');
    const shippingInfo = document.querySelector('.shipping-info');
    
    cartItems.forEach(item => {
        const deleteBtn = item.querySelector('.delete-btn');
        const qtyBtns = item.querySelectorAll('.qty-btn');
        const qtyValue = item.querySelector('.qty-value');
        const itemPrice = parseFloat(item.querySelector('.item-price').textContent.replace('$', ''));
        const itemTotal = item.querySelector('.item-total');
        
        // Delete item with animation
        deleteBtn.addEventListener('click', function() {
            // Animate shipping info moving up
            if (shippingInfo) {
                shippingInfo.style.transform = 'translateY(-20px)';
                shippingInfo.style.opacity = '0';
            }
            
            // Animate item removal
            item.style.transition = 'all 0.3s ease-out';
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                item.remove();
                updateCartTotals();
                
                // Reset shipping info animation
                if (shippingInfo) {
                    setTimeout(() => {
                        shippingInfo.style.transform = 'translateY(0)';
                        shippingInfo.style.opacity = '1';
                    }, 50);
                }
            }, 300);
        });
        
        // Quantity buttons
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
});
