class ProductRenderer {
    constructor(productsGrid, templateId) {
        this.productsGrid = productsGrid;
        this.template = document.getElementById(templateId);
        this.products = [];
        this.meta = null;
        this.maxPrice = 400;
        this.requestId = 0;
    }

    async loadCatalog(filters = {}) {
        const requestId = ++this.requestId;
        const params = new URLSearchParams();
        params.set('page', String(filters.page || 1));
        params.set('limit', String(filters.limit || 12));

        if (filters.search) {
            params.set('search', filters.search);
        }
        if (filters.minPrice != null) {
            params.set('min_price', String(filters.minPrice));
        }
        if (filters.maxPrice != null) {
            params.set('max_price', String(filters.maxPrice));
        }
        if (filters.minRating) {
            params.set('min_rating', String(filters.minRating));
        }
        if (filters.sortBy) {
            params.set('sort_by', filters.sortBy);
        }
        if (filters.order) {
            params.set('order', filters.order);
        }

        try {
            const data = await Api.apiFetch(`/api/products?${params.toString()}`);
            if (requestId !== this.requestId) {
                return null;
            }

            this.products = data.items || [];
            this.meta = data.meta || null;
            this.renderProducts(this.products);
            this.updateEmptyState(this.products.length === 0);
            return data;
        } catch (error) {
            if (requestId !== this.requestId) {
                return null;
            }
            this.products = [];
            this.meta = null;
            this.renderProducts([]);
            this.updateEmptyState(true);
            console.error('Failed to load products:', error);
            return null;
        }
    }

    async loadMaxPrice() {
        try {
            const data = await Api.apiFetch('/api/products?page=1&limit=100&sort_by=price&order=desc');
            const prices = (data.items || []).map((item) => Number(item.price));
            this.maxPrice = prices.length > 0 ? Math.max(...prices) : 400;
        } catch (error) {
            this.maxPrice = 400;
        }
        return this.maxPrice;
    }

    getMaxPrice() {
        return this.maxPrice;
    }

    renderProducts(products = this.products) {
        this.productsGrid.innerHTML = '';
        products.forEach((product) => {
            this.productsGrid.appendChild(this.createProductCard(product));
        });
        this.updateProductCount();
    }

    createProductCard(product) {
        const card = this.template.content.cloneNode(true);
        const productCard = card.querySelector('.product-card');
        const imageUrl = Api.productImage(product);

        productCard.dataset.rating = product.rating;
        productCard.dataset.productId = product.id;

        const img = card.querySelector('img');
        img.src = imageUrl;
        img.alt = product.title;

        const openDetail = () => {
            window.location.href = `product-detail.html?id=${product.id}`;
        };

        card.querySelector('.product-image').addEventListener('click', openDetail);
        const productTitle = card.querySelector('.product-title');
        productTitle.textContent = product.title;
        productTitle.addEventListener('click', openDetail);

        card.querySelector('.product-price').textContent = `$${Number(product.price).toFixed(2)}`;
        card.querySelector('.product-category').textContent = product.category || '';
        card.querySelector('.rating-count').textContent = `(${product.rating})`;
        this.renderStars(card.querySelector('.stars'), product.rating);

        card.querySelector('.add-to-cart-btn').addEventListener('click', () => {
            this.addToCart(product);
        });

        return card;
    }

    async addToCart(product) {
        if (!Api.requireAuth(window.location.href)) {
            return;
        }

        const productId = Number(product && product.id);
        if (!productId) {
            alert('Product id is missing');
            return;
        }

        try {
            await Api.apiFetch('/api/cart/items', {
                method: 'POST',
                body: JSON.stringify({ productId, quantity: 1 })
            });
            window.dispatchEvent(new Event('cart:updated'));
            this.showAddedNotification(product.title);
        } catch (error) {
            alert(error.message || 'Failed to add product to cart');
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
        const countElement = document.querySelector('.products-count');
        if (!countElement) {
            return;
        }
        const total = this.meta ? this.meta.total_items : this.productsGrid.children.length;
        countElement.textContent = `Showing ${total} products`;
    }

    updateEmptyState(isEmpty) {
        const noProductsMessage = document.getElementById('noProductsMessage');
        if (!noProductsMessage) {
            return;
        }
        noProductsMessage.style.display = isEmpty ? 'block' : 'none';
        this.productsGrid.style.display = isEmpty ? 'none' : 'grid';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const renderer = new ProductRenderer(
        document.querySelector('.products-grid'),
        'product-card-template'
    );
    window.productRenderer = renderer;

    await renderer.loadMaxPrice();
    window.dispatchEvent(new Event('catalog:ready'));
});
