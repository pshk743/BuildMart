const toggleFiltersBtn = document.getElementById('toggleFilters');
const filtersPanel = document.getElementById('filtersPanel');
const filterBtnText = document.getElementById('filterBtnText');

toggleFiltersBtn.addEventListener('click', () => {
    filtersPanel.classList.toggle('hidden');
    filterBtnText.textContent = filtersPanel.classList.contains('hidden') ? 'Show Filters' : 'Hide Filters';
});

const ratingBtns = document.querySelectorAll('.rating-btn');
const minSlider = document.getElementById('priceMin');
const maxSlider = document.getElementById('priceMax');
const minLabel = document.getElementById('minLabel');
const maxLabel = document.getElementById('maxLabel');
const track = document.querySelector('.dual-range-slider');
const clearBtn = document.querySelector('.clear-filters-btn');
const searchInput = document.querySelector('.search-input');
const sortSelect = document.querySelector('.sort-select');
const productsGrid = document.querySelector('.products-grid');

function updateSlider() {
    let minVal = +minSlider.value;
    let maxVal = +maxSlider.value;
    const maxLimit = +maxSlider.max;

    if (minVal > maxVal) minVal = maxVal;
    if (maxVal < minVal) maxVal = minVal;

    minSlider.value = minVal;
    maxSlider.value = maxVal;

    const minPct = (minVal / maxLimit) * 100;
    const maxPct = (maxVal / maxLimit) * 100;

    track.style.background = `
        linear-gradient(to right,
            #E4E7EC 0%, #E4E7EC ${minPct}%,
            #030213 ${minPct}%, #030213 ${maxPct}%,
            #E4E7EC ${maxPct}%, #E4E7EC 100%)
    `;

    minLabel.textContent = `$${minVal}`;
    maxLabel.textContent = `$${maxVal}`;
}

minSlider.addEventListener('input', () => { updateSlider(); filterProducts(); });
maxSlider.addEventListener('input', () => { updateSlider(); filterProducts(); });
updateSlider();

function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const minVal = +minSlider.value;
    const maxVal = +maxSlider.value;
    const activeRatings = Array.from(ratingBtns)
        .filter(btn => btn.classList.contains('active'))
        .map(btn => +btn.dataset.rating);

    document.querySelectorAll('.product-card').forEach(card => {
        const title = card.querySelector('.product-title').textContent.toLowerCase();
        const desc = card.querySelector('.product-description').textContent.toLowerCase();
        const price = +card.querySelector('.current-price').textContent.replace('$','');
        const rating = +card.dataset.rating;

        const matchesSearch = title.includes(searchTerm) || desc.includes(searchTerm);
        const matchesPrice = price >= minVal && price <= maxVal;
        const matchesRating = activeRatings.length === 0 || activeRatings.includes(rating);

        card.style.display = (matchesSearch && matchesPrice && matchesRating) ? 'block' : 'none';
    });
}

ratingBtns.forEach(btn => btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    filterProducts();
}));

searchInput.addEventListener('input', filterProducts);

clearBtn.addEventListener('click', () => {
    ratingBtns.forEach(btn => btn.classList.remove('active'));
    minSlider.value = minSlider.min;
    maxSlider.value = maxSlider.max;
    updateSlider();
    filterProducts();
});

sortSelect.addEventListener('change', () => {
    const sortBy = sortSelect.value;
    const cards = Array.from(document.querySelectorAll('.product-card'));

    cards.sort((a,b) => {
        if(sortBy === 'Name (A-Z)')
            return a.querySelector('.product-title').textContent.localeCompare(b.querySelector('.product-title').textContent);
        if(sortBy === 'Price (Low to High)')
            return +a.querySelector('.current-price').textContent.replace('$','') - +b.querySelector('.current-price').textContent.replace('$','');
        if(sortBy === 'Price (High to Low)')
            return +b.querySelector('.current-price').textContent.replace('$','') - +a.querySelector('.current-price').textContent.replace('$','');
        return 0;
    });

    cards.forEach(card => productsGrid.appendChild(card));
});