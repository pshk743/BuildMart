class ProductRenderer {
    constructor(productsGrid, templateId) {
        this.productsGrid = productsGrid;
        this.template = document.getElementById(templateId);
        this.products = [];
    }

    async loadProducts(jsonUrl) {
        try {
            const response = await fetch(jsonUrl);
            const data = await response.json();
            this.products = Array.isArray(data) ? data : (data.products || []);
            return this.products;
        } catch (error) {
            return [];
        }
    }

    renderProducts(products = this.products) {
        this.productsGrid.innerHTML = '';
        products.forEach(product => {
            const card = this.createProductCard(product);
            this.productsGrid.appendChild(card);
        });
        this.updateProductCount();
    }

    getMaxPrice() {
        if (this.products.length === 0) return 400;

        const maxPrice = Math.max(...this.products.map(p => p.price));
        return maxPrice;
    }

    createProductCard(product) {
        const card = this.template.content.cloneNode(true);
        const productCard = card.querySelector('.product-card');

        productCard.dataset.rating = product.rating;
        productCard.dataset.productId = product.id;

        card.querySelector('img').src = product.image;
        card.querySelector('img').alt = product.alt || product.title;
        card.querySelector('.product-title').textContent = product.title;
        card.querySelector('.product-price').textContent = `${product.price.toFixed(2)}`;
        card.querySelector('.product-category').textContent = product.category;
        card.querySelector('.rating-count').textContent = `(${product.rating})`;

        this.renderStars(card.querySelector('.stars'), product.rating);

        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        addToCartBtn.addEventListener('click', () => {
            this.addToCart(product);
        });

        return card;
    }

    addToCart(product) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                category: product.category,
                image: product.image,
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartBadge();
        this.showAddedNotification(product.title);
    }

    updateCartBadge() {
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

    showAddedNotification(productTitle) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Added ${productTitle} to cart</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    }

    renderStars(starsContainer, rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHTML = '';

        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<span class="star filled">★</span>';
        }

        if (hasHalfStar) {
            starsHTML += '<span class="star half-filled">★</span>';
        }

        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<span class="star">★</span>';
        }

        starsContainer.innerHTML = starsHTML;
    }

    updateProductCount() {
        const count = this.productsGrid.children.length;
        const countElement = document.querySelector('.products-count');
        if (countElement) {
            countElement.textContent = `Showing ${count} products`;
        }
    }

    filterProducts(filters) {
        const filtered = this.products.filter(product => {
            const matchesSearch = !filters.search ||
                product.title.toLowerCase().includes(filters.search.toLowerCase());
            const matchesPrice = product.price >= filters.minPrice &&
                product.price <= filters.maxPrice;
            const matchesRating = filters.minRating === 0 ||
                product.rating >= filters.minRating;

            return matchesSearch && matchesPrice && matchesRating;
        });

        this.renderProducts(filtered);

        const noProductsMessage = document.getElementById('noProductsMessage');
        const productsGrid = document.querySelector('.products-grid');

        if (filtered.length === 0) {
            noProductsMessage.style.display = 'block';
            productsGrid.style.display = 'none';
        } else {
            noProductsMessage.style.display = 'none';
            productsGrid.style.display = 'grid';
        }

        return filtered;
    }

    sortProducts(sortBy) {
        const sorted = [...this.products];

        switch(sortBy) {
            case 'Name (A-Z)':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'Price (Low to High)':
                sorted.sort((a, b) => a.price - b.price);
                break;
            case 'Price (High to Low)':
                sorted.sort((a, b) => b.price - a.price);
                break;
            case 'Rating':
                sorted.sort((a, b) => b.rating - a.rating);
                break;
        }

        this.renderProducts(sorted);
        return sorted;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const renderer = new ProductRenderer(
        document.querySelector('.products-grid'),
        'product-card-template'
    );

    await renderer.loadProducts('data/products.json');
    renderer.renderProducts();
    renderer.updateCartBadge();

    const cartBtn = document.querySelector('.cart-btn');
    cartBtn.addEventListener('click', () => {
        window.location.href = 'cart.html';
    });

    window.productRenderer = renderer;
});
