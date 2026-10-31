let currentProduct = null;
let currentImageIndex = 0;

function getProductIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'), 10);
}

async function loadProductData() {
    const productId = getProductIdFromURL();
    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        currentProduct = await Api.apiFetch(`/api/products/${productId}`);
        displayProduct(currentProduct);
    } catch (error) {
        console.error('Error loading product:', error);
        window.location.href = 'index.html';
    }
}

function getProductImages(product) {
    if (product.images && product.images.length > 0) {
        return product.images;
    }
    const fallback = Api.productImage(product);
    return fallback ? [fallback, fallback, fallback] : [];
}

function displayProduct(product) {
    document.getElementById('product-title').textContent = product.title;
    document.getElementById('breadcrumb-product').textContent = product.title;
    document.title = `${product.title} - BuildMart`;
    document.getElementById('product-price').textContent = `$${Number(product.price).toFixed(2)}`;
    displayRating(product.rating);
    displayGallery(getProductImages(product), product.title);
    document.getElementById('product-description').textContent =
        product.description || 'High-quality building material for your construction needs.';

    if (product.specifications) {
        displaySpecifications(product.specifications);
    }

    loadRelatedProducts();
}

function displaySpecifications(specs) {
    const specsGrid = document.getElementById('specs-grid');
    specsGrid.innerHTML = '';

    Object.entries(specs).forEach(([label, value]) => {
        const specItem = document.createElement('div');
        specItem.className = 'spec-item';
        specItem.innerHTML = `
            <div class="spec-label">${label}</div>
            <div class="spec-value">${value}</div>
        `;
        specsGrid.appendChild(specItem);
    });
}

function toggleSpecs() {
    document.querySelector('.specs-section').classList.toggle('open');
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

    document.getElementById('product-rating').textContent = `(${Number(rating).toFixed(1)})`;
}

function displayGallery(images, alt) {
    const mainImage = document.getElementById('main-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');

    if (!images.length) {
        return;
    }

    currentImageIndex = 0;
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
    if (!currentProduct) {
        return;
    }

    const images = getProductImages(currentProduct);
    currentImageIndex = index;
    document.getElementById('main-image').src = images[index];
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

function changeImage(direction) {
    const images = getProductImages(currentProduct);
    currentImageIndex = (currentImageIndex + direction + images.length) % images.length;
    selectImage(currentImageIndex);
}

function increaseQuantity() {
    const input = document.getElementById('quantity-input');
    input.value = parseInt(input.value, 10) + 1;
}

function decreaseQuantity() {
    const input = document.getElementById('quantity-input');
    if (parseInt(input.value, 10) > 1) {
        input.value = parseInt(input.value, 10) - 1;
    }
}

async function addToCart() {
    if (!currentProduct) {
        return;
    }
    if (!Api.requireAuth(window.location.href)) {
        return;
    }

    const quantity = parseInt(document.getElementById('quantity-input').value, 10) || 1;

    try {
        await Api.apiFetch('/api/cart/items', {
            method: 'POST',
            body: JSON.stringify({
                productId: Number(currentProduct.id),
                quantity
            })
        });
        window.dispatchEvent(new Event('cart:updated'));
        showAddedNotification(currentProduct.title, quantity);
    } catch (error) {
        alert(error.message || 'Failed to add product to cart');
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

async function loadRelatedProducts() {
    try {
        if (!currentProduct || !currentProduct.category) {
            displayRelatedProducts([]);
            return;
        }

        const data = await Api.apiFetch('/api/products?page=1&limit=12');
        const related = (data.items || [])
            .filter((item) => item.id !== currentProduct.id && item.category === currentProduct.category)
            .slice(0, 2);
        displayRelatedProducts(related);
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

function displayRelatedProducts(products) {
    const grid = document.getElementById('related-products-grid');
    grid.innerHTML = '';

    products.forEach((product) => {
        const card = document.createElement('div');
        card.className = 'related-product-card';
        const imageUrl = Api.productImage(product);

        card.innerHTML = `
            <div class="related-product-image">
                <img src="${imageUrl}" alt="${product.title}">
            </div>
            <div class="related-product-info">
                <h3 class="related-product-title">${product.title}</h3>
                <div class="related-product-rating">
                    <div class="related-product-stars">${generateStarsHTML(product.rating)}</div>
                    <span>(${Number(product.rating).toFixed(1)})</span>
                </div>
                <div class="related-product-price">$${Number(product.price).toFixed(2)}</div>
            </div>
        `;

        card.addEventListener('click', () => {
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

document.addEventListener('DOMContentLoaded', () => {
    loadProductData();
});
