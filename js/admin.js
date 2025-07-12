// McCluskey Pottery Admin Panel JavaScript

// Initialize admin data structure
let adminData = {
    products: [],
    orders: [],
    settings: {
        email: 'hello@mccluskeypottery.ie',
        phone: '+44 (0) 28 7777 0000',
        shippingMessage: 'Free shipping on orders over £50. All pieces carefully packaged.'
    }
};

// Demo password
const DEMO_PASSWORD = 'pottery123';

// Current editing product
let editingProductId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAdminData();
    setupEventListeners();
    checkAuthentication();
});

// Authentication
function checkAuthentication() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn) {
        showDashboard();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
    }
}

// Login functionality
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    
    if (password === DEMO_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showDashboard();
        showNotification('Welcome back! You\'re now logged in.');
    } else {
        showNotification('Incorrect password. Please try again.', 'error');
    }
});

function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').classList.remove('hidden');
    updateDashboard();
}

function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    location.reload();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Add product form
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
    
    // Image upload preview
    document.getElementById('product-image').addEventListener('change', handleImagePreview);
    
    // Shop settings form
    document.getElementById('shop-settings-form').addEventListener('submit', handleSettingsSave);
    
    // Order filters
    document.querySelectorAll('.orders-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.orders-filters .filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const status = this.getAttribute('data-status');
            displayOrders(status);
        });
    });
}

// Navigation between sections
function showSection(sectionName) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionName) {
            item.classList.add('active');
        }
    });
    
    // Update content
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // Refresh data for specific sections
    if (sectionName === 'products') {
        displayProducts();
    } else if (sectionName === 'orders') {
        displayOrders('all');
    } else if (sectionName === 'overview') {
        updateDashboard();
    }
}

// Dashboard update
function updateDashboard() {
    // Update stats
    document.getElementById('total-products').textContent = adminData.products.length;
    document.getElementById('total-orders').textContent = adminData.orders.length;
    
    // Calculate revenue
    const totalRevenue = adminData.orders.reduce((sum, order) => {
        return sum + (order.status === 'completed' ? order.total : 0);
    }, 0);
    document.getElementById('total-revenue').textContent = `£${totalRevenue.toFixed(2)}`;
    
    // Find best seller
    const productSales = {};
    adminData.orders.forEach(order => {
        order.items.forEach(item => {
            productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
        });
    });
    
    const bestSeller = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])[0];
    document.getElementById('best-seller').textContent = bestSeller ? bestSeller[0] : 'No sales yet';
    
    // Display recent orders
    displayRecentOrders();
}

// Display recent orders on dashboard
function displayRecentOrders() {
    const recentOrdersEl = document.getElementById('recent-orders');
    const recentOrders = adminData.orders.slice(-5).reverse();
    
    if (recentOrders.length === 0) {
        recentOrdersEl.innerHTML = '<p class="no-data">No orders yet. Share your website to start receiving orders!</p>';
        return;
    }
    
    recentOrdersEl.innerHTML = recentOrders.map(order => `
        <div class="order-item">
            <div>
                <strong>Order #${order.id}</strong>
                <p style="color: var(--warm-gray); font-size: 14px;">${new Date(order.date).toLocaleDateString()}</p>
            </div>
            <div>
                <p>${order.customer.name}</p>
                <p style="color: var(--warm-gray); font-size: 14px;">${order.items.length} items</p>
            </div>
            <div>
                <strong>£${order.total.toFixed(2)}</strong>
            </div>
            <div>
                <span class="order-status status-${order.status}">${order.status}</span>
            </div>
        </div>
    `).join('');
}

// Product Management
function handleAddProduct(e) {
    e.preventDefault();
    
    const imageInput = document.getElementById('product-image');
    const imageFile = imageInput.files[0];
    
    if (!imageFile) {
        showNotification('Please select a product image', 'error');
        return;
    }
    
    // Read image as base64
    const reader = new FileReader();
    reader.onload = function(event) {
        const product = {
            id: editingProductId || Date.now(),
            name: document.getElementById('product-name').value,
            story: document.getElementById('product-story').value,
            category: document.getElementById('product-category').value,
            price: parseFloat(document.getElementById('product-price').value),
            stock: parseInt(document.getElementById('product-stock').value) || 1,
            badge: document.getElementById('product-badge').value,
            featured: document.getElementById('product-featured').checked,
            image: event.target.result,
            dateAdded: editingProductId ? 
                adminData.products.find(p => p.id === editingProductId).dateAdded : 
                new Date().toISOString()
        };
        
        if (editingProductId) {
            // Update existing product
            const index = adminData.products.findIndex(p => p.id === editingProductId);
            adminData.products[index] = product;
            showNotification('Product updated successfully!');
            closeEditModal();
        } else {
            // Add new product
            adminData.products.push(product);
            showNotification('Product added successfully!');
            resetProductForm();
        }
        
        saveAdminData();
        updateMainWebsiteProducts();
        showSection('products');
    };
    
    reader.readAsDataURL(imageFile);
}

// Handle image preview
function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('image-preview');
            preview.src = event.target.result;
            preview.classList.remove('hidden');
            document.querySelector('.upload-placeholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// Display products in admin
function displayProducts() {
    const productsList = document.getElementById('products-list');
    
    if (adminData.products.length === 0) {
        productsList.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    No products yet. Click "Add New Product" to get started!
                </td>
            </tr>
        `;
        return;
    }
    
    productsList.innerHTML = adminData.products.map(product => `
        <tr>
            <td>
                <div class="product-image-cell">
                    <img src="${product.image}" alt="${product.name}">
                </div>
            </td>
            <td>
                <strong>${product.name}</strong>
                ${product.featured ? '<span style="color: var(--terracotta); font-size: 12px;"> ⭐ Featured</span>' : ''}
            </td>
            <td>${getCategoryName(product.category)}</td>
            <td>£${product.price.toFixed(2)}</td>
            <td class="${product.stock <= 5 ? 'stock-low' : ''}">${product.stock}</td>
            <td>
                <div class="product-actions">
                    <button class="btn-edit" onclick="editProduct(${product.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Edit product
function editProduct(productId) {
    const product = adminData.products.find(p => p.id === productId);
    if (!product) return;
    
    editingProductId = productId;
    
    // Populate form
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-story').value = product.story;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-badge').value = product.badge || '';
    document.getElementById('product-featured').checked = product.featured;
    
    // Show image preview
    const preview = document.getElementById('image-preview');
    preview.src = product.image;
    preview.classList.remove('hidden');
    document.querySelector('.upload-placeholder').style.display = 'none';
    
    // Make image optional for editing
    document.getElementById('product-image').removeAttribute('required');
    
    // Change button text
    document.querySelector('#add-product-form button[type="submit"]').textContent = 'Update Product';
    
    // Show add product section
    showSection('add-product');
}

// Delete product
function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        adminData.products = adminData.products.filter(p => p.id !== productId);
        saveAdminData();
        updateMainWebsiteProducts();
        displayProducts();
        showNotification('Product deleted successfully');
    }
}

// Order Management
function displayOrders(filter = 'all') {
    const ordersList = document.getElementById('orders-list');
    let filteredOrders = adminData.orders;
    
    if (filter !== 'all') {
        filteredOrders = adminData.orders.filter(order => order.status === filter);
    }
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '<p class="no-data">No orders found.</p>';
        return;
    }
    
    ordersList.innerHTML = filteredOrders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-number">Order #${order.id}</div>
                    <div class="order-date">${new Date(order.date).toLocaleString()}</div>
                </div>
                <span class="order-status status-${order.status}">${order.status}</span>
            </div>
            
            <div class="order-customer">
                <h4>${order.customer.name}</h4>
                <p>${order.customer.email}</p>
                <p>${order.customer.phone || 'No phone provided'}</p>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item-row">
                        <span>${item.name} x ${item.quantity}</span>
                        <span>£${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
                <div class="order-total">Total: £${order.total.toFixed(2)}</div>
            </div>
            
            <div class="order-actions">
                ${order.status === 'pending' ? 
                    `<button class="btn-primary" onclick="updateOrderStatus(${order.id}, 'processing')">Start Processing</button>` : ''}
                ${order.status === 'processing' ? 
                    `<button class="btn-primary" onclick="updateOrderStatus(${order.id}, 'completed')">Mark Complete</button>` : ''}
                ${order.status === 'completed' ? 
                    `<button class="btn-secondary" disabled>Completed ✓</button>` : ''}
            </div>
        </div>
    `).join('');
}

// Update order status
function updateOrderStatus(orderId, newStatus) {
    const order = adminData.orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        saveAdminData();
        displayOrders('all');
        showNotification(`Order #${orderId} marked as ${newStatus}`);
    }
}

// Settings Management
function handleSettingsSave(e) {
    e.preventDefault();
    
    adminData.settings = {
        email: document.getElementById('shop-email').value,
        phone: document.getElementById('shop-phone').value,
        shippingMessage: document.getElementById('shipping-message').value
    };
    
    saveAdminData();
    showNotification('Settings saved successfully!');
}

// Utility functions
function getCategoryName(category) {
    const categories = {
        'irish': 'Irish Traditions',
        'seasonal': 'Seasonal',
        'special': 'Special Editions'
    };
    return categories[category] || category;
}

function resetProductForm() {
    document.getElementById('add-product-form').reset();
    document.getElementById('image-preview').classList.add('hidden');
    document.querySelector('.upload-placeholder').style.display = 'block';
    document.getElementById('product-image').setAttribute('required', 'required');
    document.querySelector('#add-product-form button[type="submit"]').textContent = 'Add Product';
    editingProductId = null;
}

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

// Help modal
function showHelp() {
    document.getElementById('help-modal').classList.remove('hidden');
}

function closeHelpModal() {
    document.getElementById('help-modal').classList.add('hidden');
}

function closeEditModal() {
    resetProductForm();
}

// Export functions
function exportProducts() {
    const dataStr = JSON.stringify(adminData.products, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mccluskey-pottery-products.json';
    link.click();
    showNotification('Products exported successfully!');
}

function exportOrders() {
    const dataStr = JSON.stringify(adminData.orders, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mccluskey-pottery-orders.json';
    link.click();
    showNotification('Orders exported successfully!');
}

function clearDemoData() {
    if (confirm('Are you sure you want to clear all demo data? This cannot be undone.')) {
        localStorage.removeItem('mccluskeyAdminData');
        adminData = {
            products: [],
            orders: [],
            settings: {
                email: 'hello@mccluskeypottery.ie',
                phone: '+44 (0) 28 7777 0000',
                shippingMessage: 'Free shipping on orders over £50. All pieces carefully packaged.'
            }
        };
        updateDashboard();
        showNotification('All data cleared successfully');
    }
}

// Data persistence
function saveAdminData() {
    localStorage.setItem('mccluskeyAdminData', JSON.stringify(adminData));
}

function loadAdminData() {
    const savedData = localStorage.getItem('mccluskeyAdminData');
    if (savedData) {
        adminData = JSON.parse(savedData);
    }
    
    // Load settings into form
    if (adminData.settings) {
        document.getElementById('shop-email').value = adminData.settings.email;
        document.getElementById('shop-phone').value = adminData.settings.phone;
        document.getElementById('shipping-message').value = adminData.settings.shippingMessage;
    }
}

// Update main website products
function updateMainWebsiteProducts() {
    // Convert admin products to website format
    const websiteProducts = adminData.products.map(product => ({
        id: product.id,
        name: product.name,
        story: product.story,
        price: product.price,
        category: product.category,
        image: product.image,
        badge: product.badge,
        featured: product.featured,
        stock: product.stock
    }));
    
    // Save to main website storage
    localStorage.setItem('mccluskeyProducts', JSON.stringify(websiteProducts));
    
    // Notify if main website is open
    window.postMessage({ type: 'productsUpdated' }, '*');
}

// Simulate receiving an order (for demo)
function simulateOrder() {
    const demoOrder = {
        id: Date.now(),
        date: new Date().toISOString(),
        status: 'pending',
        customer: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+44 7700 900000'
        },
        items: [
            {
                name: 'Sláinte Guinness Piece',
                quantity: 1,
                price: 48.00
            },
            {
                name: 'Irish Swallow',
                quantity: 2,
                price: 35.00
            }
        ],
        total: 118.00
    };
    
    adminData.orders.push(demoOrder);
    saveAdminData();
    updateDashboard();
    showNotification('New order received! Check the Orders section.');
}

// Check for orders from main site
window.addEventListener('message', (event) => {
    if (event.data.type === 'newOrder') {
        adminData.orders.push(event.data.order);
        saveAdminData();
        updateDashboard();
        showNotification('New order received!');
    }
});