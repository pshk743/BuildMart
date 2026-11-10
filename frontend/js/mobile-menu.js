function initMobileMenu() {
    const burgerBtn = document.getElementById('burgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const searchBtnMobile = document.getElementById('searchBtnMobile');
    const body = document.body;

    if (!burgerBtn || !mobileMenu) {
        return;
    }

    function toggleMenu() {
        mobileMenu.classList.toggle('active');
        burgerBtn.classList.toggle('active');
        body.classList.toggle('menu-open');
    }

    function closeMenu() {
        mobileMenu.classList.remove('active');
        burgerBtn.classList.remove('active');
        body.classList.remove('menu-open');
    }

    burgerBtn.addEventListener('click', toggleMenu);

    if (searchBtnMobile) {
        searchBtnMobile.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                if (!mobileMenu.classList.contains('active')) {
                    toggleMenu();
                }
                const mobileSearchInput = document.querySelector('.mobile-search .search-input');
                if (mobileSearchInput) {
                    setTimeout(() => mobileSearchInput.focus(), 300);
                }
            }
        });
    }

    document.querySelectorAll('.mobile-nav .nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && mobileMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    document.addEventListener('click', function(event) {
        const isClickInsideMenu = mobileMenu.contains(event.target);
        const isClickOnBurger = burgerBtn.contains(event.target);
        if (mobileMenu.classList.contains('active') && !isClickInsideMenu && !isClickOnBurger) {
            closeMenu();
        }
    });

    const currentPath = window.location.pathname;
    document.querySelectorAll('.mobile-nav .nav-link, .nav .nav-link').forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath || (currentPath === '/' && linkPath === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}