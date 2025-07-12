// McCluskey Pottery - Artisanal JavaScript

// Load security utilities
const script = document.createElement('script');
script.src = 'js/security.js';
document.head.appendChild(script);

// Use real products from McCluskey Pottery if available
const defaultProducts = typeof mccluskeyProducts !== 'undefined' ? mccluskeyProducts : [];

// Load products from admin or use defaults
let products = loadProducts();

// Shopping cart
let cart = [];

// DOM elements cache
const elements = {
    loader: document.getElementById('loader'),
    productsGrid: document.getElementById('products-grid'),
    cartModal: document.getElementById('cart-modal'),
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total'),
    cartCount: document.querySelector('.cart-count'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    menuToggle: document.querySelector('.menu-toggle'),
    navMenu: document.querySelector('.nav-menu'),
    navbar: document.querySelector('.navbar')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Initialize all app functions
function initializeApp() {
    // Hide loader after content loads
    setTimeout(() => {
        elements.loader.classList.add('hidden');
    }, 2000);
    
    // Setup all components
    setupNavigation();
    displayProducts('all');
    setupFilters();
    setupCart();
    setupForms();
    loadCartFromStorage();
    setupScrollEffects();
    
    // Listen for product updates from admin
    window.addEventListener('message', (event) => {
        if (event.data.type === 'productsUpdated') {
            products = loadProducts();
            displayProducts('all');
            showNotification('New products added!');
        }
    });
}

// Load products from admin storage or use defaults
function loadProducts() {
    const savedProducts = localStorage.getItem('mccluskeyProducts');
    if (savedProducts) {
        const adminProducts = JSON.parse(savedProducts);
        // Handle both base64 images from admin and regular image paths
        return adminProducts.map(product => ({
            ...product,
            image: product.image.startsWith('data:') ? product.image : `images/${product.image}`
        }));
    }
    return defaultProducts;
}

// Navigation setup
function setupNavigation() {
    // Mobile menu toggle
    elements.menuToggle.addEventListener('click', () => {
        elements.navMenu.classList.toggle('active');
        elements.menuToggle.classList.toggle('active');
    });
    
    // Close mobile menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            elements.navMenu.classList.remove('active');
        });
    });
    
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Ensure blog links work properly
    document.querySelectorAll('.blog-link, .btn-outline').forEach(link => {
        if (link.href && !link.href.startsWith('#')) {
            link.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    });
}

// Scroll effects
function setupScrollEffects() {
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Navbar background on scroll
        if (currentScroll > 100) {
            elements.navbar.classList.add('scrolled');
        } else {
            elements.navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// Display products with optional filter
function displayProducts(filter = 'all') {
    const filteredProducts = filter === 'all' 
        ? products 
        : products.filter(product => product.category === filter);
    
    elements.productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card ${product.featured ? 'featured' : ''}" data-category="${product.category}">
            <a href="product-detail.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                <div class="product-image">
                    ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                    ${product.stock !== undefined && product.stock === 0 ? '<div class="product-badge" style="background: #dc3545;">Out of Stock</div>' : ''}
                    <img src="${product.image}" alt="${product.name}" 
                         style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-story">${product.story}</p>
                    ${product.details ? `<p class="product-details">${product.details}</p>` : ''}
                </div>
            </a>
            <div class="product-info" style="padding-top: 0;">
                <div class="product-footer">
                    <span class="product-price">£${product.price.toFixed(2)}</span>
                    <button class="add-to-cart" onclick="addToCart(${product.id})" 
                            ${product.stock !== undefined && product.stock === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        ${product.stock !== undefined && product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add fade-in animation
    setTimeout(() => {
        document.querySelectorAll('.product-card').forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 100);
}

// Setup filter buttons
function setupFilters() {
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter products
            const filter = this.getAttribute('data-filter');
            displayProducts(filter);
        });
    });
    
    // Setup search functionality
    setupSearch();
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('product-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm.length === 0) {
            // Get current filter
            const activeFilterBtn = document.querySelector('.filter-btn.active');
            const currentFilter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
            displayProducts(currentFilter);
            return;
        }
        
        // Filter products based on search term
        const searchResults = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            (product.story && product.story.toLowerCase().includes(searchTerm))
        );
        
        // Display search results
        displaySearchResults(searchResults, searchTerm);
    });
}

// Display search results
function displaySearchResults(results, searchTerm) {
    if (results.length === 0) {
        elements.productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <h3 style="color: var(--warm-gray); margin-bottom: 20px;">No results found for "${searchTerm}"</h3>
                <p style="color: var(--warm-gray);">Try searching for bowls, mugs, vases, or specific product names.</p>
            </div>
        `;
        return;
    }
    
    // Display found products using the same format as displayProducts
    elements.productsGrid.innerHTML = results.map(product => `
        <div class="product-card ${product.featured ? 'featured' : ''}" data-category="${product.category}">
            <a href="product-detail.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                <div class="product-image">
                    ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                    ${product.stock !== undefined && product.stock === 0 ? '<div class="product-badge" style="background: #dc3545;">Out of Stock</div>' : ''}
                    <img src="${product.image}" alt="${product.name}" 
                         style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-story">${product.story}</p>
                    ${product.details ? `<p class="product-details">${product.details}</p>` : ''}
                </div>
            </a>
            <div class="product-info" style="padding-top: 0;">
                <div class="product-footer">
                    <span class="product-price">£${product.price.toFixed(2)}</span>
                    <button class="add-to-cart" onclick="addToCart(${product.id})" 
                            ${product.stock !== undefined && product.stock === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        ${product.stock !== undefined && product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add fade-in animation
    setTimeout(() => {
        document.querySelectorAll('.product-card').forEach((card, index) => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    }, 100);
}

// Cart functionality
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    
    // Check stock if available
    if (product.stock !== undefined && product.stock === 0) {
        showNotification('Sorry, this item is out of stock', 'error');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        // Check if adding more would exceed stock
        if (product.stock !== undefined && existingItem.quantity >= product.stock) {
            showNotification(`Only ${product.stock} available in stock`, 'error');
            return;
        }
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCart();
    saveCartToStorage();
    showNotification(`${product.name} added to cart`);
    
    // Animate cart icon
    elements.cartCount.classList.add('pulse');
    setTimeout(() => elements.cartCount.classList.remove('pulse'), 500);
}

// Update cart display
function updateCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartCount.textContent = totalItems;
    
    if (cart.length === 0) {
        elements.cartItems.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--warm-gray);">
                <p style="font-size: 18px; margin-bottom: 20px;">Your collection is empty</p>
                <p>Discover our handcrafted pieces</p>
            </div>
        `;
        elements.cartTotal.textContent = '£0.00';
        return;
    }
    
    elements.cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--warm-gray);font-size:14px;">
                    ${item.name}
                </div>
            </div>
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <div class="cart-item-price">£${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                    <span style="min-width: 30px; text-align: center;">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})">×</button>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    elements.cartTotal.textContent = `£${total.toFixed(2)}`;
}

// Update quantity
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCart();
            saveCartToStorage();
        }
    }
}

// Remove from cart
function removeFromCart(productId) {
    const product = cart.find(item => item.id === productId);
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    saveCartToStorage();
    showNotification(`${product.name} removed from cart`);
}

// Setup cart modal
function setupCart() {
    // Open cart
    document.querySelector('.cart-icon a').addEventListener('click', (e) => {
        e.preventDefault();
        elements.cartModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Close cart
    document.querySelector('.modal-close').addEventListener('click', () => {
        elements.cartModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === elements.cartModal) {
            elements.cartModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Checkout
    document.querySelector('.checkout-btn').addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('Your cart is empty');
            return;
        }
        
        // Show checkout form
        showCheckoutForm();
    });
}

// Storage functions
function saveCartToStorage() {
    localStorage.setItem('mccluskeyCart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('mccluskeyCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: ${type === 'success' ? 'var(--irish-green)' : '#dc3545'};
        color: white;
        padding: 15px 30px;
        border-radius: 30px;
        box-shadow: var(--shadow-strong);
        z-index: 3000;
        animation: slideUp 0.3s ease;
        font-weight: 500;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Show checkout form
function showCheckoutForm() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create checkout modal
    const checkoutModal = document.createElement('div');
    checkoutModal.className = 'modal';
    checkoutModal.id = 'checkout-modal';
    checkoutModal.style.display = 'block';
    checkoutModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <button class="modal-close" onclick="closeCheckout()">×</button>
            <h2>Complete Your Order</h2>
            <form id="checkout-form" style="margin-top: 30px;">
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" id="customer-name" required placeholder="Jane Smith">
                </div>
                <div class="form-group">
                    <label>Email Address *</label>
                    <input type="email" id="customer-email" required placeholder="jane@example.com">
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="customer-phone" placeholder="+44 7700 900000">
                </div>
                <div class="form-group">
                    <label>Delivery Address *</label>
                    <textarea id="customer-address" required placeholder="123 Main Street
Belfast, BT1 1AA
Northern Ireland"></textarea>
                </div>
                <div class="form-group">
                    <label>Special Instructions</label>
                    <textarea id="order-notes" placeholder="Any special requests or gift messages..."></textarea>
                </div>
                <div style="margin: 30px 0; padding: 20px; background: var(--pottery-cream); border-radius: 10px;">
                    <h3 style="margin-bottom: 15px;">Order Summary</h3>
                    ${cart.map(item => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>${item.name} x ${item.quantity}</span>
                            <span>£${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    <div style="border-top: 2px solid var(--irish-green); margin-top: 15px; padding-top: 15px;">
                        <strong style="display: flex; justify-content: space-between; font-size: 20px;">
                            <span>Total:</span>
                            <span>£${total.toFixed(2)}</span>
                        </strong>
                    </div>
                </div>
                <p style="text-align: center; color: var(--warm-gray); margin-bottom: 20px;">
                    This is a demo checkout. No payment will be processed.
                </p>
                <button type="submit" class="checkout-btn" style="width: 100%;">
                    Place Order
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(checkoutModal);
    document.body.style.overflow = 'hidden';
    
    // Handle form submission
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
}

// Close checkout modal
function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Handle checkout submission
function handleCheckout(e) {
    e.preventDefault();
    
    // Check rate limiting
    if (typeof Security !== 'undefined' && !Security.rateLimiter.canSubmit('checkout', 3, 60000)) {
        const remainingTime = Math.ceil(Security.rateLimiter.getRemainingTime('checkout') / 1000);
        showNotification(`Please wait ${remainingTime} seconds before trying again`, 'error');
        return;
    }
    
    // Get form data
    const formData = {
        name: document.getElementById('customer-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value,
        address: document.getElementById('customer-address').value
    };
    
    // Validate form data
    if (typeof Security !== 'undefined') {
        const validation = Security.validateForm(formData);
        if (!validation.isValid) {
            Security.displayErrors(e.target, validation.errors);
            return;
        }
    }
    
    // Create order object with sanitized data
    const order = {
        id: Date.now(),
        date: new Date().toISOString(),
        status: 'pending',
        customer: {
            name: typeof Security !== 'undefined' ? Security.sanitizeInput(formData.name) : formData.name,
            email: typeof Security !== 'undefined' ? Security.sanitizeInput(formData.email) : formData.email,
            phone: typeof Security !== 'undefined' ? Security.sanitizeInput(formData.phone) : formData.phone,
            address: typeof Security !== 'undefined' ? Security.sanitizeInput(formData.address) : formData.address
        },
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        })),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        notes: typeof Security !== 'undefined' ? Security.sanitizeInput(document.getElementById('order-notes').value) : document.getElementById('order-notes').value
    };
    
    // Save order to admin storage
    const adminData = JSON.parse(localStorage.getItem('mccluskeyAdminData') || '{"orders": []}');
    adminData.orders.push(order);
    localStorage.setItem('mccluskeyAdminData', JSON.stringify(adminData));
    
    // Update product stock if applicable
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product && product.stock !== undefined) {
            product.stock = Math.max(0, product.stock - item.quantity);
        }
    });
    
    // Save updated products
    if (products.some(p => p.stock !== undefined)) {
        localStorage.setItem('mccluskeyProducts', JSON.stringify(products));
    }
    
    // Notify admin panel if open
    window.postMessage({ type: 'newOrder', order }, '*');
    
    // Clear cart
    cart = [];
    updateCart();
    saveCartToStorage();
    
    // Close modals and show success
    closeCheckout();
    elements.cartModal.style.display = 'none';
    
    // Show success message
    showNotification(`Thank you for your order, ${order.customer.name}! Order #${order.id} has been received.`);
    
    // Refresh products to show updated stock
    displayProducts('all');
}

// Setup forms
function setupForms() {
    // Contact form
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Check rate limiting
            if (typeof Security !== 'undefined' && !Security.rateLimiter.canSubmit('contact', 3, 60000)) {
                const remainingTime = Math.ceil(Security.rateLimiter.getRemainingTime('contact') / 1000);
                showNotification(`Please wait ${remainingTime} seconds before trying again`, 'error');
                return;
            }
            
            // Get form inputs
            const inputs = e.target.querySelectorAll('input, textarea');
            const formData = {};
            
            inputs.forEach(input => {
                if (input.type === 'text' && !input.placeholder.includes('Email')) {
                    formData.name = input.value;
                } else if (input.type === 'email') {
                    formData.email = input.value;
                } else if (input.tagName === 'TEXTAREA') {
                    formData.message = input.value;
                }
            });
            
            // Validate form data
            if (typeof Security !== 'undefined') {
                const validation = Security.validateForm(formData);
                if (!validation.isValid) {
                    Security.displayErrors(e.target, validation.errors);
                    return;
                }
            }
            
            showNotification('Thank you for your message! We\'ll be in touch soon.');
            e.target.reset();
        });
    }
    
    // Newsletter form
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Check rate limiting
            if (typeof Security !== 'undefined' && !Security.rateLimiter.canSubmit('newsletter', 5, 60000)) {
                const remainingTime = Math.ceil(Security.rateLimiter.getRemainingTime('newsletter') / 1000);
                showNotification(`Please wait ${remainingTime} seconds before trying again`, 'error');
                return;
            }
            
            const emailInput = e.target.querySelector('input[type="email"]');
            if (emailInput) {
                // Validate email
                if (typeof Security !== 'undefined' && !Security.validateEmail(emailInput.value)) {
                    showNotification('Please enter a valid email address', 'error');
                    return;
                }
            }
            
            showNotification('Welcome to our circle! Check your email for confirmation.');
            e.target.reset();
        });
    }
}

// Add animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            transform: translateY(100px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideDown {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(100px);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    
    .pulse {
        animation: pulse 0.5s ease;
    }
    
    .product-card {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.5s ease;
    }
    
    .menu-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .menu-toggle.active span:nth-child(2) {
        transform: rotate(-45deg) translate(5px, -5px);
    }
`;
document.head.appendChild(style);