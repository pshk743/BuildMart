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

if (ratingBtns.length >= 3) {
    ratingBtns[0].dataset.rating = 5;
    ratingBtns[1].dataset.rating = 4;
    ratingBtns[2].dataset.rating = 3;
}

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

function initPriceSlider() {
    if (!window.productRenderer) return;

    const maxPrice = window.productRenderer.getMaxPrice();

    minSlider.max = maxPrice;
    maxSlider.max = maxPrice;
    minSlider.value = 0;
    maxSlider.value = maxPrice;

    minLabel.textContent = `$0`;
    maxLabel.textContent = `$${maxPrice}`;

    updateSlider();
}

function filterProducts() {
    if (!window.productRenderer) {
        return;
    }

    const searchTerm = searchInput.value.toLowerCase().trim();
    const minVal = +minSlider.value;
    const maxVal = +maxSlider.value;

    const activeRatings = Array.from(ratingBtns)
        .filter(btn => btn.classList.contains('active'))
        .map(btn => +btn.dataset.rating);

    const filters = {
        search: searchTerm,
        minPrice: minVal,
        maxPrice: maxVal,
        minRating: activeRatings.length > 0 ? Math.min(...activeRatings) : 0
    };

    window.productRenderer.filterProducts(filters);
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

function clearAllFilters() {
    ratingBtns.forEach(btn => btn.classList.remove('active'));

    minSlider.value = 0;
    maxSlider.value = minSlider.max;

    searchInput.value = '';
    updateSlider();
    filterProducts();
}

clearBtn.addEventListener('click', clearAllFilters);
clearFromMessage.addEventListener('click', clearAllFilters);

sortSelect.addEventListener('change', () => {
    if (!window.productRenderer) return;
    const sortBy = sortSelect.value;
    window.productRenderer.sortProducts(sortBy);
});

const checkRenderer = setInterval(() => {
    if (window.productRenderer) {
        clearInterval(checkRenderer);
        initPriceSlider();
        filterProducts();
    }
}, 100);