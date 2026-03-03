const noProductsMessage = document.getElementById('noProductsMessage');
const clearFromMessage = document.getElementById('clearFromMessage');
const toggleFiltersBtn = document.getElementById('toggleFilters');
const filtersPanel = document.getElementById('filtersPanel');
const filterBtnText = document.getElementById('filterBtnText');
const searchInput = document.querySelector('.search-input');
const sortSelect = document.querySelector('.sort-select');
const productsGrid = document.querySelector('.products-grid');
const productsCountSpan = document.querySelector('.products-count');

const ratingBtns = document.querySelectorAll('.rating-btn');
const minSlider = document.getElementById('priceMin');
const maxSlider = document.getElementById('priceMax');
const minLabel = document.getElementById('minLabel');
const maxLabel = document.getElementById('maxLabel');
const track = document.getElementById('rangeTrack');
const clearBtn = document.querySelector('.clear-filters-btn');

ratingBtns[0].dataset.rating = 5;
ratingBtns[1].dataset.rating = 4;
ratingBtns[2].dataset.rating = 3;

document.querySelectorAll('.product-card').forEach(card => {
    const ratingText = card.querySelector('.rating-count').textContent;
    const rating = parseFloat(ratingText.replace(/[()]/g, ''));
    card.dataset.rating = rating;
});

toggleFiltersBtn.addEventListener('click', () => {
    filtersPanel.classList.toggle('hidden');
    filterBtnText.textContent = filtersPanel.classList.contains('hidden') ? 'Show Filters' : 'Hide Filters';
});

function updateSlider() {
    let minVal = +minSlider.value;
    let maxVal = +maxSlider.value;
    const maxLimit = +maxSlider.max;

    if (minVal > maxVal) {
        [minVal, maxVal] = [maxVal, minVal];
    }

    minSlider.value = minVal;
    maxSlider.value = maxVal;

    const minPct = (minVal / maxLimit) * 100;
    const maxPct = (maxVal / maxLimit) * 100;

    track.style.background = `linear-gradient(to right, 
        #E4E7EC 0%, #E4E7EC ${minPct}%, 
        #030213 ${minPct}%, #030213 ${maxPct}%, 
        #E4E7EC ${maxPct}%, #E4E7EC 100%)`;

    minLabel.textContent = `$${minVal}`;
    maxLabel.textContent = `$${maxVal}`;
}

function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const minVal = +minSlider.value;
    const maxVal = +maxSlider.value;

    const activeRatings = Array.from(ratingBtns)
        .filter(btn => btn.classList.contains('active'))
        .map(btn => +btn.dataset.rating);

    let visibleCount = 0;

    document.querySelectorAll('.product-card').forEach(card => {
        const title = card.querySelector('.product-title').textContent.toLowerCase();
        const priceText = card.querySelector('.product-price').textContent;
        const price = parseFloat(priceText.replace('$', ''));
        const rating = +card.dataset.rating;

        const matchesSearch = searchTerm === '' || title.includes(searchTerm);
        const matchesPrice = price >= minVal && price <= maxVal;
        const matchesRating = activeRatings.length === 0 ||
            activeRatings.some(r => rating >= r);

        if (matchesSearch && matchesPrice && matchesRating) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    if (visibleCount === 0) {
        noProductsMessage.style.display = 'block';
        productsGrid.style.display = 'none';
    } else {
        noProductsMessage.style.display = 'none';
        productsGrid.style.display = 'grid';
    }

    productsCountSpan.textContent = `Showing ${visibleCount} products`;
}

minSlider.addEventListener('input', () => {
    updateSlider();
    filterProducts();
});

maxSlider.addEventListener('input', () => {
    updateSlider();
    filterProducts();
});

ratingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        filterProducts();
    });
});

searchInput.addEventListener('input', filterProducts);

clearBtn.addEventListener('click', () => {
    ratingBtns.forEach(btn => btn.classList.remove('active'));
    minSlider.value = minSlider.min;
    maxSlider.value = maxSlider.max;
    searchInput.value = '';
    updateSlider();
    filterProducts();
});

clearFromMessage.addEventListener('click', () => {
    ratingBtns.forEach(btn => btn.classList.remove('active'));
    minSlider.value = minSlider.min;
    maxSlider.value = maxSlider.max;
    searchInput.value = '';
    updateSlider();
    filterProducts();
});

sortSelect.addEventListener('change', () => {
    const sortBy = sortSelect.value;
    const cards = Array.from(document.querySelectorAll('.product-card'));

    cards.sort((a, b) => {
        const titleA = a.querySelector('.product-title').textContent;
        const titleB = b.querySelector('.product-title').textContent;
        const priceA = parseFloat(a.querySelector('.product-price').textContent.replace('$', ''));
        const priceB = parseFloat(b.querySelector('.product-price').textContent.replace('$', ''));

        switch(sortBy) {
            case 'Name (A-Z)':
                return titleA.localeCompare(titleB);
            case 'Price (Low to High)':
                return priceA - priceB;
            case 'Price (High to Low)':
                return priceB - priceA;
            default:
                return 0;
        }
    });

    cards.forEach(card => productsGrid.appendChild(card));

    filterProducts();
});

updateSlider();
filterProducts();

productsCountSpan.textContent = `Showing ${document.querySelectorAll('.product-card').length} products`;

window.addEventListener('load', () => {
    productsGrid.style.display = 'grid';
});