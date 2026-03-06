let currentProduct = null;
let currentImageIndex = 0;

function getProductIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
}

async function loadProductData() {
    try {
        const response = await fetch('data/products.json');
        const products = await response.json();
        const productId = getProductIdFromURL();
        
        currentProduct = products.find(p => p.id === productId);
        
        if (currentProduct) {
            displayProduct(currentProduct);
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error loading product:', error);
    }
}

function displayProduct(product) {
    document.getElementById('product-title').textContent = product.title;
    document.getElementById('breadcrumb-product').textContent = product.title;
    document.title = `${product.title} - BuildMart`;

    document.getElementById('product-price').textContent = `$${product.price.toFixed(2)}`;

    displayRating(product.rating);

    const images = [product.image, product.image, product.image];
    displayGallery(images, product.alt);

    document.getElementById('product-description').textContent = product.description || 'High-quality building material for your construction needs.';

    if (product.specifications) {
        displaySpecifications(product.specifications);
    }

    currentProduct.category = product.category;

    loadRelatedProducts();
}

function displaySpecifications(specs) {
    const specsGrid = document.getElementById('specs-grid');
    specsGrid.innerHTML = '';
    
    for (const [label, value] of Object.entries(specs)) {
        const specItem = document.createElement('div');
        specItem.className = 'spec-item';
        specItem.innerHTML = `
            <div class="spec-label">${label}</div>
            <div class="spec-value">${value}</div>
        `;
        specsGrid.appendChild(specItem);
    }
}

function toggleSpecs() {
    const specsSection = document.querySelector('.specs-section');
    specsSection.classList.toggle('open');
}

function displayRating(rating) {
    const starsContainer = document.getElementById('product-stars');
    starsContainer.innerHTML = '';
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
        starsContainer.innerHTML += `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="#FFB800" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 1L12.5 7.5H19L14 11.5L16 18L10 14L4 18L6 11.5L1 7.5H7.5L10 1Z"/>
            </svg>
        `;
    }
    
    if (hasHalfStar) {
        starsContainer.innerHTML += `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="half-fill">
                        <stop offset="50%" stop-color="#FFB800"/>
                        <stop offset="50%" stop-color="#E5E9F0"/>
                    </linearGradient>
                </defs>
                <path d="M10 1L12.5 7.5H19L14 11.5L16 18L10 14L4 18L6 11.5L1 7.5H7.5L10 1Z" fill="url(#half-fill)"/>
            </svg>
        `;
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsContainer.innerHTML += `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="#E5E9F0" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 1L12.5 7.5H19L14 11.5L16 18L10 14L4 18L6 11.5L1 7.5H7.5L10 1Z"/>
            </svg>
        `;
    }
    
    document.getElementById('product-rating').textContent = `(${rating.toFixed(1)})`;
}

function displayGallery(images, alt) {
    const mainImage = document.getElementById('main-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    
    mainImage.src = images[0];
    mainImage.alt = alt;
    
    thumbnailContainer.innerHTML = '';
    images.forEach((img, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
        thumbnail.innerHTML = `<img src="${img}" alt="${alt}">`;
        thumbnail.onclick = () => selectImage(index);
        thumbnailContainer.appendChild(thumbnail);
    });
}

function selectImage(index) {
    if (!currentProduct) return;
    
    currentImageIndex = index;
    const images = [currentProduct.image, currentProduct.image, currentProduct.image];
    
    document.getElementById('main-image').src = images[index];
    
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

function changeImage(direction) {
    const images = [currentProduct.image, currentProduct.image, currentProduct.image];
    currentImageIndex = (currentImageIndex + direction + images.length) % images.length;
    selectImage(currentImageIndex);
}

function increaseQuantity() {
    const input = document.getElementById('quantity-input');
    input.value = parseInt(input.value) + 1;
}

function decreaseQuantity() {
    const input = document.getElementById('quantity-input');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

function addToCart() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity-input').value);
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingItem = cart.find(item => item.id === currentProduct.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: currentProduct.id,
            title: currentProduct.title,
            price: currentProduct.price,
            category: currentProduct.category,
            image: currentProduct.image,
            quantity: quantity
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));

    updateCartBadge();

    showAddedNotification(currentProduct.title, quantity);
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
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

function showAddedNotification(productTitle, quantity) {
    const existingNotification = document.querySelector('.cart-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Added ${quantity} ${productTitle} to cart</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    loadProductData();
    updateCartBadge();

    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }
});

async function loadRelatedProducts() {
    try {
        const response = await fetch('data/products.json');
        const products = await response.json();
        
        console.log('All products:', products);
        console.log('Current product:', currentProduct);

        let relatedProducts = products
            .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
            .slice(0, 3);
        
        console.log('Same category products:', relatedProducts);

        if (relatedProducts.length < 3) {
            const otherProducts = products
                .filter(p => p.id !== currentProduct.id && !relatedProducts.find(rp => rp.id === p.id))
                .slice(0, 3 - relatedProducts.length);
            relatedProducts = [...relatedProducts, ...otherProducts];
        }
        
        console.log('Final related products:', relatedProducts);

        displayRelatedProducts(relatedProducts);
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

function displayRelatedProducts(products) {
    const grid = document.getElementById('related-products-grid');
    grid.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'related-product-card';

        const stars = generateStarsHTML(product.rating);

        const imageUrl = product.relatedImage || product.image;

        card.innerHTML = `
            <div class="related-product-image">
                <img src="${imageUrl}" alt="${product.alt || product.title}">
            </div>
            <div class="related-product-info">
                <h3 class="related-product-title">${product.title}</h3>
                <div class="related-product-rating">
                    <div class="related-product-stars">${stars}</div>
                    <span>(${product.rating.toFixed(1)})</span>
                </div>
                <div class="related-product-price">$${product.price.toFixed(2)}</div>
            </div>
        `;

        card.addEventListener('click', function() {
            window.location.href = `product-detail.html?id=${product.id}`;
        });

        grid.appendChild(card);
    });
}

function generateStarsHTML(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHTML += `
            <svg width="16" height="16" viewBox="0 0 20 20" fill="#FFB800" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 1L12.5 7.5H19L14 11.5L16 18L10 14L4 18L6 11.5L1 7.5H7.5L10 1Z"/>
            </svg>
        `;
    }
    
    if (hasHalfStar) {
        starsHTML += `
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="half-fill-${rating}">
                        <stop offset="50%" stop-color="#FFB800"/>
                        <stop offset="50%" stop-color="#E5E9F0"/>
                    </linearGradient>
                </defs>
                <path d="M10 1L12.5 7.5H19L14 11.5L16 18L10 14L4 18L6 11.5L1 7.5H7.5L10 1Z" fill="url(#half-fill-${rating})"/>
            </svg>
        `;
    }
    
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += `
            <svg width="16" height="16" viewBox="0 0 20 20" fill="#E5E9F0" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 1L12.5 7.5H19L14 11.5L16 18L10 14L4 18L6 11.5L1 7.5H7.5L10 1Z"/>
            </svg>
        `;
    }
    
    return starsHTML;
}
