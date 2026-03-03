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
        return Math.ceil(maxPrice);
    }

    createProductCard(product) {
        const card = this.template.content.cloneNode(true);
        const productCard = card.querySelector('.product-card');

        productCard.dataset.rating = product.rating;

        card.querySelector('img').src = product.image;
        card.querySelector('img').alt = product.alt || product.title;
        card.querySelector('.product-title').textContent = product.title;
        card.querySelector('.product-price').textContent = `$${product.price.toFixed(2)}`;
        card.querySelector('.product-category').textContent = product.category;
        card.querySelector('.rating-count').textContent = `(${product.rating})`;

        this.renderStars(card.querySelector('.stars'), product.rating);

        return card;
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

    window.productRenderer = renderer;
});