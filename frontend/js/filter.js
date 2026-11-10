const noProductsMessage = document.getElementById('noProductsMessage');
const clearFromMessage = document.getElementById('clearFromMessage');
const toggleFiltersBtn = document.getElementById('toggleFilters');
const filtersPanel = document.getElementById('filtersPanel');
const filterBtnText = document.getElementById('filterBtnText');
const sortSelect = document.querySelector('.sort-select');
const ratingBtns = document.querySelectorAll('.rating-btn');
const minSlider = document.getElementById('priceMin');
const maxSlider = document.getElementById('priceMax');
const minLabel = document.getElementById('minLabel');
const maxLabel = document.getElementById('maxLabel');
const track = document.getElementById('rangeTrack');
const clearBtn = document.querySelector('.clear-filters-btn');

let debounceTimer = null;

if (ratingBtns.length >= 3) {
    ratingBtns[0].dataset.rating = 5;
    ratingBtns[1].dataset.rating = 4;
    ratingBtns[2].dataset.rating = 3;
}

toggleFiltersBtn.addEventListener('click', () => {
    filtersPanel.classList.toggle('hidden');
    filterBtnText.textContent = filtersPanel.classList.contains('hidden') ? 'Show Filters' : 'Hide Filters';
});

function getSearchInputs() {
    return Array.from(document.querySelectorAll('.search-input'));
}

function getSearchTerm() {
    const input = getSearchInputs().find((el) => el.value.trim()) || getSearchInputs()[0];
    return input ? input.value.trim() : '';
}

function syncSearchInputs(value, source) {
    getSearchInputs().forEach((input) => {
        if (input !== source) {
            input.value = value;
        }
    });
}

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

    minLabel.textContent = `$${minVal.toFixed(2)}`;
    maxLabel.textContent = `$${maxVal.toFixed(2)}`;
}

function initPriceSlider() {
    if (!window.productRenderer) {
        return;
    }

    const maxPrice = window.productRenderer.getMaxPrice();
    minSlider.max = maxPrice;
    maxSlider.max = maxPrice;
    minSlider.value = 0;
    maxSlider.value = maxPrice;
    minLabel.textContent = '$0.00';
    maxLabel.textContent = `$${maxPrice.toFixed(2)}`;
    updateSlider();
}

function mapSort(sortLabel) {
    switch (sortLabel) {
        case 'Price (Low to High)':
            return { sortBy: 'price', order: 'asc' };
        case 'Price (High to Low)':
            return { sortBy: 'price', order: 'desc' };
        case 'Name (A-Z)':
        default:
            return { sortBy: 'title', order: 'asc' };
    }
}

function collectFilters() {
    const activeRatings = Array.from(ratingBtns)
        .filter((btn) => btn.classList.contains('active'))
        .map((btn) => +btn.dataset.rating);
    const sort = mapSort(sortSelect ? sortSelect.value : 'Name (A-Z)');

    return {
        search: getSearchTerm(),
        minPrice: +minSlider.value,
        maxPrice: +maxSlider.value,
        minRating: activeRatings.length > 0 ? Math.min(...activeRatings) : 0,
        sortBy: sort.sortBy,
        order: sort.order,
        page: 1,
        limit: 12
    };
}

function filterProducts() {
    if (!window.productRenderer) {
        return;
    }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        window.productRenderer.loadCatalog(collectFilters());
    }, 250);
}

minSlider.addEventListener('input', () => {
    updateSlider();
    filterProducts();
});

maxSlider.addEventListener('input', () => {
    updateSlider();
    filterProducts();
});

ratingBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        filterProducts();
    });
});

function bindSearchInputs() {
    getSearchInputs().forEach((input) => {
        if (input.dataset.bound === 'true') {
            return;
        }
        input.dataset.bound = 'true';
        input.addEventListener('input', () => {
            syncSearchInputs(input.value, input);
            filterProducts();
        });
    });
}

function clearAllFilters() {
    ratingBtns.forEach((btn) => btn.classList.remove('active'));
    minSlider.value = 0;
    maxSlider.value = minSlider.max;
    getSearchInputs().forEach((input) => {
        input.value = '';
    });
    if (sortSelect) {
        sortSelect.selectedIndex = 0;
    }
    updateSlider();
    filterProducts();
}

clearBtn.addEventListener('click', clearAllFilters);
clearFromMessage.addEventListener('click', clearAllFilters);

sortSelect.addEventListener('change', filterProducts);

window.addEventListener('catalog:ready', () => {
    initPriceSlider();
    bindSearchInputs();
    filterProducts();
});

document.addEventListener('DOMContentLoaded', () => {
    bindSearchInputs();
});
