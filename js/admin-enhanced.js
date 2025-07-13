// McCluskey Pottery Enhanced Admin Panel
// Complete rewrite with improved functionality and security

// Admin configuration
const AdminConfig = {
    // Simulated secure auth (in production, this would be server-side)
    AUTH_KEY: 'mccluskey_admin_2024',
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    IMAGE_QUALITY: 0.85,
    ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp', 'svg']
};

// Enhanced admin data structure
class AdminDataManager {
    constructor() {
        this.data = {
            products: [],
            orders: [],
            settings: {
                email: 'hello@mccluskeypottery.ie',
                phone: '+44 28 7772 1234',
                shippingMessage: 'Free shipping on orders over £50. All pieces carefully packaged.',
                orderNotifications: true,
                lowStockAlert: 5,
                currency: '£',
                taxRate: 0 // VAT if applicable
            },
            analytics: {
                pageViews: 0,
                cartAbandoned: 0,
                conversionRate: 0
            }
        };
        this.listeners = [];
        this.loadData();
    }

    loadData() {
        const saved = localStorage.getItem('mccluskeyAdminData');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.data = { ...this.data, ...parsed };
            } catch (e) {
                console.error('Failed to load admin data:', e);
            }
        }
    }

    saveData() {
        try {
            localStorage.setItem('mccluskeyAdminData', JSON.stringify(this.data));
            this.notifyListeners('data-saved');
        } catch (e) {
            console.error('Failed to save admin data:', e);
            AdminUI.showNotification('Failed to save data', 'error');
        }
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => callback(event, data));
    }

    // Product methods
    addProduct(product) {
        product.id = Date.now();
        product.dateAdded = new Date().toISOString();
        product.views = 0;
        product.sales = 0;
        this.data.products.push(product);
        this.saveData();
        this.notifyListeners('product-added', product);
        return product;
    }

    updateProduct(id, updates) {
        const index = this.data.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.data.products[index] = { ...this.data.products[index], ...updates };
            this.saveData();
            this.notifyListeners('product-updated', this.data.products[index]);
            return true;
        }
        return false;
    }

    deleteProduct(id) {
        const index = this.data.products.findIndex(p => p.id === id);
        if (index !== -1) {
            const deleted = this.data.products.splice(index, 1)[0];
            this.saveData();
            this.notifyListeners('product-deleted', deleted);
            return true;
        }
        return false;
    }

    // Order methods
    addOrder(order) {
        order.id = `ORD-${Date.now()}`;
        order.date = new Date().toISOString();
        order.status = order.status || 'pending';
        
        // Update inventory
        order.items.forEach(item => {
            const product = this.data.products.find(p => p.id === item.productId);
            if (product && product.stock >= item.quantity) {
                product.stock -= item.quantity;
                product.sales += item.quantity;
            }
        });

        this.data.orders.push(order);
        this.saveData();
        this.notifyListeners('order-added', order);
        
        // Check for low stock
        this.checkLowStock();
        
        return order;
    }

    updateOrderStatus(orderId, status) {
        const order = this.data.orders.find(o => o.id === orderId);
        if (order) {
            const previousStatus = order.status;
            order.status = status;
            order.statusHistory = order.statusHistory || [];
            order.statusHistory.push({
                status,
                date: new Date().toISOString()
            });
            
            // Handle inventory adjustments
            if (status === 'cancelled' && previousStatus !== 'cancelled') {
                // Return stock to inventory when order is cancelled
                order.items.forEach(item => {
                    const product = this.data.products.find(p => p.name === item.name);
                    if (product) {
                        product.stock = (product.stock || 0) + item.quantity;
                    }
                });
            } else if (status === 'completed' && previousStatus !== 'completed') {
                // Track sales when order is completed
                order.items.forEach(item => {
                    const product = this.data.products.find(p => p.name === item.name);
                    if (product) {
                        product.sales = (product.sales || 0) + item.quantity;
                    }
                });
            }
            
            this.saveData();
            this.notifyListeners('order-updated', order);
            
            // Sync inventory with main website
            this.syncProductInventory();
            
            return true;
        }
        return false;
    }
    
    syncProductInventory() {
        // Update main website's product data
        const websiteProducts = this.data.products.map(product => ({
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
        
        localStorage.setItem('mccluskeyProducts', JSON.stringify(websiteProducts));
        window.postMessage({ type: 'productsUpdated' }, '*');
    }

    // Analytics methods
    getAnalytics() {
        const totalRevenue = this.data.orders
            .filter(o => o.status === 'completed')
            .reduce((sum, order) => sum + order.total, 0);

        const totalOrders = this.data.orders.length;
        const completedOrders = this.data.orders.filter(o => o.status === 'completed').length;
        
        const productStats = {};
        this.data.orders.forEach(order => {
            order.items.forEach(item => {
                if (!productStats[item.productId]) {
                    productStats[item.productId] = {
                        quantity: 0,
                        revenue: 0,
                        name: item.name
                    };
                }
                productStats[item.productId].quantity += item.quantity;
                productStats[item.productId].revenue += item.price * item.quantity;
            });
        });

        const bestSeller = Object.entries(productStats)
            .sort((a, b) => b[1].quantity - a[1].quantity)[0];

        return {
            totalRevenue,
            totalOrders,
            completedOrders,
            conversionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(1) : 0,
            bestSeller: bestSeller ? bestSeller[1].name : 'No sales yet',
            averageOrderValue: totalOrders > 0 ? (totalRevenue / completedOrders).toFixed(2) : 0,
            productStats
        };
    }

    checkLowStock() {
        const lowStockProducts = this.data.products.filter(
            p => p.stock <= this.data.settings.lowStockAlert
        );
        
        if (lowStockProducts.length > 0) {
            this.notifyListeners('low-stock', lowStockProducts);
        }
    }

    // Search and filter
    searchProducts(query) {
        const searchTerm = query.toLowerCase();
        return this.data.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.story.toLowerCase().includes(searchTerm) ||
            product.category.includes(searchTerm)
        );
    }

    filterProducts(filters) {
        let filtered = [...this.data.products];
        
        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(p => p.category === filters.category);
        }
        
        if (filters.inStock !== undefined) {
            filtered = filtered.filter(p => filters.inStock ? p.stock > 0 : p.stock === 0);
        }
        
        if (filters.featured !== undefined) {
            filtered = filtered.filter(p => p.featured === filters.featured);
        }
        
        return filtered;
    }
}

// Enhanced UI Manager
class AdminUI {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentSection = 'overview';
        this.editingProductId = null;
        this.imageUploadHandler = new ImageUploadHandler();
        this.setupEventListeners();
        this.initializeDragDrop();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Mobile menu toggle
        this.addMobileMenuToggle();

        // Forms
        document.getElementById('add-product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProductSubmit();
        });

        document.getElementById('shop-settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSettingsSave();
        });

        // Search and filters
        this.setupSearchAndFilters();

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Data change listeners
        this.dataManager.addListener((event, data) => {
            this.handleDataChange(event, data);
        });
    }

    addMobileMenuToggle() {
        const toggleBtn = document.getElementById('admin-menu-toggle');
        const adminNav = document.getElementById('admin-nav');
        
        if (!toggleBtn || !adminNav) return;
        
        toggleBtn.addEventListener('click', () => {
            toggleBtn.classList.toggle('active');
            adminNav.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!toggleBtn.contains(e.target) && !adminNav.contains(e.target) && adminNav.classList.contains('active')) {
                toggleBtn.classList.remove('active');
                adminNav.classList.remove('active');
            }
        });
        
        // Close menu when clicking a nav item on mobile
        if (window.innerWidth <= 1024) {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    toggleBtn.classList.remove('active');
                    adminNav.classList.remove('active');
                });
            });
        }

        // Show on mobile
        const mediaQuery = window.matchMedia('(max-width: 1024px)');
        const handleMobile = (e) => {
            toggleBtn.style.display = e.matches ? 'block' : 'none';
        };
        mediaQuery.addListener(handleMobile);
        handleMobile(mediaQuery);
    }

    setupSearchAndFilters() {
        // Add search bar to products section
        const productsHeader = document.querySelector('#products-section .section-header');
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-filters';
        searchContainer.innerHTML = `
            <input type="text" id="product-search" placeholder="Search products..." class="search-input">
            <select id="product-filter-category" class="filter-select">
                <option value="all">All Categories</option>
                <option value="irish">Irish Traditions</option>
                <option value="seasonal">Seasonal</option>
                <option value="special">Special Editions</option>
            </select>
            <label class="filter-checkbox">
                <input type="checkbox" id="filter-in-stock"> In Stock Only
            </label>
            <label class="filter-checkbox">
                <input type="checkbox" id="filter-featured"> Featured Only
            </label>
        `;
        
        productsHeader.appendChild(searchContainer);

        // Add event listeners
        const applyFilters = () => {
            const query = document.getElementById('product-search').value;
            const filters = {
                category: document.getElementById('product-filter-category').value,
                inStock: document.getElementById('filter-in-stock').checked,
                featured: document.getElementById('filter-featured').checked
            };

            let products = query ? 
                this.dataManager.searchProducts(query) : 
                this.dataManager.data.products;

            products = this.dataManager.filterProducts({ ...filters });
            this.displayFilteredProducts(products);
        };

        document.getElementById('product-search').addEventListener('input', applyFilters);
        document.getElementById('product-filter-category').addEventListener('change', applyFilters);
        document.getElementById('filter-in-stock').addEventListener('change', applyFilters);
        document.getElementById('filter-featured').addEventListener('change', applyFilters);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.dataManager.saveData();
                AdminUI.showNotification('Data saved', 'success');
            }
            
            // Ctrl/Cmd + N for new product
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.showSection('add-product');
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    initializeDragDrop() {
        const uploadArea = document.getElementById('image-upload-area');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('drag-hover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('drag-hover');
            });
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.imageUploadHandler.handleFile(files[0]);
            }
        });
    }

    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-section') === sectionName);
        });

        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Refresh section data
            switch(sectionName) {
                case 'overview':
                    this.updateDashboard();
                    break;
                case 'products':
                    this.displayProducts();
                    break;
                case 'orders':
                    this.displayOrders('all');
                    break;
            }
        }

        this.currentSection = sectionName;
        
        // Close mobile menu
        document.querySelector('.admin-nav').classList.remove('active');
    }

    async handleProductSubmit() {
        const submitBtn = document.querySelector('#add-product-form button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            const productData = {
                name: document.getElementById('product-name').value,
                story: document.getElementById('product-story').value,
                details: document.getElementById('product-details').value || '',
                category: document.getElementById('product-category').value,
                price: parseFloat(document.getElementById('product-price').value),
                stock: parseInt(document.getElementById('product-stock').value) || 1,
                badge: document.getElementById('product-badge').value,
                featured: document.getElementById('product-featured').checked,
                dimensions: document.getElementById('product-dimensions').value || '',
                materials: document.getElementById('product-materials').value || '100% Porcelain'
            };

            // Get image
            const imageData = await this.imageUploadHandler.getImageData();
            if (!imageData && !this.editingProductId) {
                throw new Error('Please select a product image');
            }

            if (imageData) {
                productData.image = imageData;
            }

            if (this.editingProductId) {
                this.dataManager.updateProduct(this.editingProductId, productData);
                AdminUI.showNotification('Product updated successfully!', 'success');
                this.resetProductForm();
                this.showSection('products');
            } else {
                this.dataManager.addProduct(productData);
                AdminUI.showNotification('Product added successfully!', 'success');
                this.resetProductForm();
            }

            // Update main website
            this.syncWithMainWebsite();

        } catch (error) {
            AdminUI.showNotification(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = this.editingProductId ? 'Update Product' : 'Add Product';
        }
    }

    handleSettingsSave() {
        const settings = {
            email: document.getElementById('shop-email').value,
            phone: document.getElementById('shop-phone').value,
            shippingMessage: document.getElementById('shipping-message').value,
            orderNotifications: document.getElementById('order-notifications').checked,
            lowStockAlert: parseInt(document.getElementById('low-stock-alert').value) || 5
        };

        this.dataManager.data.settings = { ...this.dataManager.data.settings, ...settings };
        this.dataManager.saveData();
        AdminUI.showNotification('Settings saved successfully!', 'success');
    }

    handleDataChange(event, data) {
        switch(event) {
            case 'low-stock':
                const message = `Low stock alert: ${data.length} products are running low!`;
                AdminUI.showNotification(message, 'warning');
                break;
            case 'order-added':
                if (this.dataManager.data.settings.orderNotifications) {
                    AdminUI.showNotification(`New order received: ${data.id}`, 'success');
                    this.playNotificationSound();
                }
                if (this.currentSection === 'overview') {
                    this.updateDashboard();
                }
                break;
        }
    }

    updateDashboard() {
        const analytics = this.dataManager.getAnalytics();
        
        document.getElementById('total-products').textContent = this.dataManager.data.products.length;
        document.getElementById('total-orders').textContent = this.dataManager.data.orders.length;
        document.getElementById('total-revenue').textContent = `£${analytics.totalRevenue.toFixed(2)}`;
        document.getElementById('best-seller').textContent = analytics.bestSeller;
        
        // Add more analytics
        this.displayRecentOrders();
        this.displayLowStockAlert();
        this.displayRevenueChart();
    }

    displayProducts() {
        const tbody = document.getElementById('products-list');
        const products = this.dataManager.data.products;

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        No products yet. Click "Add New Product" to get started!
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr data-product-id="${product.id}">
                <td>
                    <div class="product-image-cell">
                        <img src="${product.image}" alt="${product.name}" loading="lazy">
                    </div>
                </td>
                <td>
                    <strong>${product.name}</strong>
                    ${product.featured ? '<span class="badge-featured">⭐ Featured</span>' : ''}
                    ${product.badge ? `<span class="badge-custom">${product.badge}</span>` : ''}
                </td>
                <td>${this.getCategoryName(product.category)}</td>
                <td>£${product.price.toFixed(2)}</td>
                <td class="${product.stock <= 5 ? 'stock-low' : ''}">${product.stock}</td>
                <td>${product.sales || 0}</td>
                <td>
                    <div class="product-actions">
                        <button class="btn-icon" onclick="adminUI.editProduct(${product.id})" title="Edit">
                            ✏️
                        </button>
                        <button class="btn-icon" onclick="adminUI.duplicateProduct(${product.id})" title="Duplicate">
                            📋
                        </button>
                        <button class="btn-icon danger" onclick="adminUI.deleteProduct(${product.id})" title="Delete">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    displayFilteredProducts(products) {
        const tbody = document.getElementById('products-list');
        
        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        No products match your search criteria.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr data-product-id="${product.id}">
                <td>
                    <div class="product-image-cell">
                        <img src="${product.image}" alt="${product.name}" loading="lazy">
                    </div>
                </td>
                <td>
                    <strong>${product.name}</strong>
                    ${product.featured ? '<span class="badge-featured">⭐ Featured</span>' : ''}
                </td>
                <td>${this.getCategoryName(product.category)}</td>
                <td>£${product.price.toFixed(2)}</td>
                <td class="${product.stock <= 5 ? 'stock-low' : ''}">${product.stock}</td>
                <td>${product.sales || 0}</td>
                <td>
                    <div class="product-actions">
                        <button class="btn-icon" onclick="adminUI.editProduct(${product.id})" title="Edit">
                            ✏️
                        </button>
                        <button class="btn-icon danger" onclick="adminUI.deleteProduct(${product.id})" title="Delete">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    displayOrders(filter = 'all') {
        const ordersList = document.getElementById('orders-list');
        let orders = [...this.dataManager.data.orders];
        
        if (filter !== 'all') {
            orders = orders.filter(order => order.status === filter);
        }
        
        // Sort by date (newest first)
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (orders.length === 0) {
            ordersList.innerHTML = '<p class="no-data">No orders found.</p>';
            return;
        }

        ordersList.innerHTML = orders.map(order => this.renderOrderCard(order)).join('');
    }

    renderOrderCard(order) {
        const statusColors = {
            pending: 'warning',
            processing: 'info',
            completed: 'success',
            cancelled: 'danger'
        };

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div>
                        <div class="order-number">${order.id}</div>
                        <div class="order-date">${new Date(order.date).toLocaleString()}</div>
                    </div>
                    <span class="order-status status-${statusColors[order.status]}">${order.status}</span>
                </div>
                
                <div class="order-customer">
                    <h4>${order.customer.name}</h4>
                    <p>${order.customer.email}</p>
                    <p>${order.customer.phone || 'No phone provided'}</p>
                    ${order.customer.address ? `
                        <p class="order-address">
                            ${order.customer.address.line1}<br>
                            ${order.customer.address.city}, ${order.customer.address.postcode}
                        </p>
                    ` : ''}
                </div>
                
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item-row">
                            <span>${item.name} × ${item.quantity}</span>
                            <span>£${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    ${order.shipping ? `
                        <div class="order-item-row">
                            <span>Shipping</span>
                            <span>£${order.shipping.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="order-total">Total: £${order.total.toFixed(2)}</div>
                </div>
                
                <div class="order-actions">
                    ${this.getOrderActions(order)}
                </div>
                
                ${order.notes ? `
                    <div class="order-notes">
                        <strong>Notes:</strong> ${order.notes}
                    </div>
                ` : ''}
            </div>
        `;
    }

    getOrderActions(order) {
        const actions = [];
        
        switch(order.status) {
            case 'pending':
                actions.push(`
                    <button class="btn-primary" onclick="adminUI.updateOrderStatus('${order.id}', 'processing')">
                        Start Processing
                    </button>
                    <button class="btn-secondary" onclick="adminUI.updateOrderStatus('${order.id}', 'cancelled')">
                        Cancel Order
                    </button>
                `);
                break;
            case 'processing':
                actions.push(`
                    <button class="btn-primary" onclick="adminUI.updateOrderStatus('${order.id}', 'completed')">
                        Mark Complete
                    </button>
                    <button class="btn-secondary" onclick="adminUI.printPackingSlip('${order.id}')">
                        Print Packing Slip
                    </button>
                `);
                break;
            case 'completed':
                actions.push(`
                    <button class="btn-secondary" disabled>✓ Completed</button>
                    <button class="btn-secondary" onclick="adminUI.viewOrderDetails('${order.id}')">
                        View Details
                    </button>
                `);
                break;
            case 'cancelled':
                actions.push(`
                    <button class="btn-secondary" disabled>Cancelled</button>
                `);
                break;
        }
        
        return actions.join('');
    }

    displayRecentOrders() {
        const container = document.getElementById('recent-orders');
        const recentOrders = this.dataManager.data.orders.slice(-5).reverse();
        
        if (recentOrders.length === 0) {
            container.innerHTML = '<p class="no-data">No orders yet. Share your website to start receiving orders!</p>';
            return;
        }

        container.innerHTML = recentOrders.map(order => `
            <div class="order-item" onclick="adminUI.showSection('orders')">
                <div>
                    <strong>${order.id}</strong>
                    <p class="text-muted">${new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div>
                    <p>${order.customer.name}</p>
                    <p class="text-muted">${order.items.length} items</p>
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

    displayLowStockAlert() {
        const lowStockProducts = this.dataManager.data.products.filter(
            p => p.stock <= this.dataManager.data.settings.lowStockAlert
        );
        
        if (lowStockProducts.length === 0) return;
        
        const alertContainer = document.createElement('div');
        alertContainer.className = 'low-stock-alert';
        alertContainer.innerHTML = `
            <h3>⚠️ Low Stock Alert</h3>
            <p>The following products are running low:</p>
            <ul>
                ${lowStockProducts.map(p => `
                    <li>${p.name} - ${p.stock} remaining</li>
                `).join('')}
            </ul>
        `;
        
        const overviewSection = document.getElementById('overview-section');
        const existingAlert = overviewSection.querySelector('.low-stock-alert');
        if (existingAlert) existingAlert.remove();
        
        overviewSection.insertBefore(alertContainer, overviewSection.querySelector('.recent-section'));
    }

    displayRevenueChart() {
        // Simple revenue visualization
        const chartContainer = document.createElement('div');
        chartContainer.className = 'revenue-chart';
        chartContainer.innerHTML = `
            <h3>Revenue Overview</h3>
            <div class="chart-placeholder">
                <p>Revenue chart would go here</p>
                <p class="text-muted">Integration with Chart.js or similar library recommended</p>
            </div>
        `;
        
        const statsGrid = document.querySelector('.stats-grid');
        const existingChart = document.querySelector('.revenue-chart');
        if (existingChart) existingChart.remove();
        
        statsGrid.parentNode.insertBefore(chartContainer, statsGrid.nextSibling);
    }

    editProduct(productId) {
        const product = this.dataManager.data.products.find(p => p.id === productId);
        if (!product) return;

        this.editingProductId = productId;

        // Populate form
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-story').value = product.story;
        document.getElementById('product-details').value = product.details || '';
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-badge').value = product.badge || '';
        document.getElementById('product-featured').checked = product.featured;
        document.getElementById('product-dimensions').value = product.dimensions || '';
        document.getElementById('product-materials').value = product.materials || '100% Porcelain';

        // Show image preview
        this.imageUploadHandler.showPreview(product.image);

        // Update button text
        document.querySelector('#add-product-form button[type="submit"]').textContent = 'Update Product';

        // Show add product section
        this.showSection('add-product');
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    duplicateProduct(productId) {
        const product = this.dataManager.data.products.find(p => p.id === productId);
        if (!product) return;

        const duplicate = { ...product };
        duplicate.name = product.name + ' (Copy)';
        delete duplicate.id;
        delete duplicate.dateAdded;
        delete duplicate.views;
        delete duplicate.sales;

        this.dataManager.addProduct(duplicate);
        this.displayProducts();
        AdminUI.showNotification('Product duplicated successfully!', 'success');
    }

    deleteProduct(productId) {
        const product = this.dataManager.data.products.find(p => p.id === productId);
        if (!product) return;

        const modal = this.createConfirmModal(
            'Delete Product',
            `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
            () => {
                if (this.dataManager.deleteProduct(productId)) {
                    this.displayProducts();
                    AdminUI.showNotification('Product deleted successfully', 'success');
                    this.syncWithMainWebsite();
                }
            }
        );
        
        document.body.appendChild(modal);
    }

    updateOrderStatus(orderId, newStatus) {
        if (this.dataManager.updateOrderStatus(orderId, newStatus)) {
            this.displayOrders();
            AdminUI.showNotification(`Order ${orderId} marked as ${newStatus}`, 'success');
            
            // Send email notification (simulated)
            if (this.dataManager.data.settings.orderNotifications) {
                console.log(`Email sent to customer about order ${orderId} status: ${newStatus}`);
            }
        }
    }

    printPackingSlip(orderId) {
        const order = this.dataManager.data.orders.find(o => o.id === orderId);
        if (!order) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Packing Slip - ${order.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #2A5434; }
                    .order-info { margin: 20px 0; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    .total { font-weight: bold; font-size: 18px; }
                </style>
            </head>
            <body>
                <h1>McCluskey Pottery - Packing Slip</h1>
                <div class="order-info">
                    <p><strong>Order:</strong> ${order.id}</p>
                    <p><strong>Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
                    <p><strong>Customer:</strong> ${order.customer.name}</p>
                    <p><strong>Email:</strong> ${order.customer.email}</p>
                    ${order.customer.phone ? `<p><strong>Phone:</strong> ${order.customer.phone}</p>` : ''}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>£${item.price.toFixed(2)}</td>
                                <td>£${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="total">Total:</td>
                            <td class="total">£${order.total.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
                <p style="margin-top: 40px;">Thank you for your order!</p>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    viewOrderDetails(orderId) {
        const order = this.dataManager.data.orders.find(o => o.id === orderId);
        if (!order) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                <h2>Order Details - ${order.id}</h2>
                <div class="order-details">
                    ${this.renderOrderCard(order)}
                    ${order.statusHistory ? `
                        <div class="status-history">
                            <h3>Status History</h3>
                            <ul>
                                ${order.statusHistory.map(h => `
                                    <li>${new Date(h.date).toLocaleString()} - ${h.status}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    resetProductForm() {
        document.getElementById('add-product-form').reset();
        this.imageUploadHandler.clearPreview();
        document.querySelector('#add-product-form button[type="submit"]').textContent = 'Add Product';
        this.editingProductId = null;
    }

    createConfirmModal(title, message, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${title}</h2>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn-primary danger" id="confirm-action">Confirm</button>
                </div>
            </div>
        `;
        
        modal.querySelector('#confirm-action').addEventListener('click', () => {
            onConfirm();
            modal.remove();
        });
        
        return modal;
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
    }

    syncWithMainWebsite() {
        // Convert admin products to website format
        const websiteProducts = this.dataManager.data.products.map(product => ({
            id: product.id,
            name: product.name,
            story: product.story,
            price: product.price,
            category: product.category,
            image: product.image,
            badge: product.badge,
            featured: product.featured,
            stock: product.stock,
            details: product.details || product.dimensions || ''
        }));

        // Save to website storage
        localStorage.setItem('mccluskeyProducts', JSON.stringify(websiteProducts));

        // Notify main website if open
        window.postMessage({ type: 'productsUpdated', products: websiteProducts }, '*');
    }

    getCategoryName(category) {
        const categories = {
            'irish': 'Irish Traditions',
            'seasonal': 'Seasonal',
            'special': 'Special Editions'
        };
        return categories[category] || category;
    }

    playNotificationSound() {
        // Create and play a simple notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    }
    
    exportProducts() {
        const dataStr = JSON.stringify(this.dataManager.data.products, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mccluskey-pottery-products.json';
        link.click();
        AdminUI.showNotification('Products exported successfully!', 'success');
    }

    exportOrders() {
        const dataStr = JSON.stringify(this.dataManager.data.orders, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mccluskey-pottery-orders.json';
        link.click();
        AdminUI.showNotification('Orders exported successfully!', 'success');
    }

    clearDemoData() {
        const modal = this.createConfirmModal(
            'Clear All Data',
            'Are you sure you want to clear all demo data? This action cannot be undone.',
            () => {
                localStorage.removeItem('mccluskeyAdminData');
                localStorage.removeItem('mccluskeyProducts');
                this.dataManager.data = {
                    products: [],
                    orders: [],
                    settings: {
                        email: 'hello@mccluskeypottery.ie',
                        phone: '+44 28 7772 1234',
                        shippingMessage: 'Free shipping on orders over £50. All pieces carefully packaged.',
                        orderNotifications: true,
                        lowStockAlert: 5,
                        currency: '£',
                        taxRate: 0
                    },
                    analytics: {
                        pageViews: 0,
                        cartAbandoned: 0,
                        conversionRate: 0
                    }
                };
                this.dataManager.saveData();
                this.showSection('overview');
                AdminUI.showNotification('All data cleared successfully', 'success');
            }
        );
        
        document.body.appendChild(modal);
    }

    showHelp() {
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.classList.remove('hidden');
            helpModal.style.display = 'flex';
        }
    }

    static showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: ${type === 'success' ? 'var(--irish-green)' : 
                         type === 'error' ? '#dc3545' : 
                         type === 'warning' ? '#ffc107' : '#17a2b8'};
            color: ${type === 'warning' ? '#333' : 'white'};
            padding: 15px 30px;
            border-radius: 30px;
            box-shadow: var(--shadow-strong);
            z-index: 3000;
            animation: slideUp 0.3s ease;
            font-weight: 500;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// Enhanced Image Upload Handler
class ImageUploadHandler {
    constructor() {
        this.currentImage = null;
        this.fileInput = document.getElementById('product-image');
        this.uploadArea = document.getElementById('image-upload-area');
        this.preview = document.getElementById('image-preview');
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });
    }

    async handleFile(file) {
        try {
            // Validate file
            this.validateFile(file);
            
            // Show loading state
            this.showLoading();
            
            // Process image
            const processedImage = await this.processImage(file);
            this.currentImage = processedImage;
            
            // Show preview
            this.showPreview(processedImage);
            
        } catch (error) {
            AdminUI.showNotification(error.message, 'error');
            this.clearPreview();
        }
    }

    validateFile(file) {
        // Check file type
        const extension = file.name.split('.').pop().toLowerCase();
        if (!AdminConfig.ALLOWED_EXTENSIONS.includes(extension)) {
            throw new Error(`Invalid file type. Allowed types: ${AdminConfig.ALLOWED_EXTENSIONS.join(', ')}`);
        }
        
        // Check file size
        if (file.size > AdminConfig.IMAGE_MAX_SIZE) {
            throw new Error(`File too large. Maximum size: ${AdminConfig.IMAGE_MAX_SIZE / 1024 / 1024}MB`);
        }
    }

    async processImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    // Create image element
                    const img = new Image();
                    img.onload = async () => {
                        // Resize if needed
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Calculate new dimensions (max 1200px)
                        const maxSize = 1200;
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > maxSize || height > maxSize) {
                            if (width > height) {
                                height = (height / width) * maxSize;
                                width = maxSize;
                            } else {
                                width = (width / height) * maxSize;
                                height = maxSize;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        // Draw and compress
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Convert to base64 with compression
                        const compressedImage = canvas.toDataURL('image/jpeg', AdminConfig.IMAGE_QUALITY);
                        resolve(compressedImage);
                    };
                    
                    img.onerror = () => reject(new Error('Failed to load image'));
                    img.src = e.target.result;
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    showLoading() {
        this.uploadArea.classList.add('loading');
        this.uploadArea.querySelector('.upload-placeholder').innerHTML = `
            <div class="spinner"></div>
            <p>Processing image...</p>
        `;
    }

    showPreview(imageSrc) {
        this.uploadArea.classList.remove('loading');
        this.preview.src = imageSrc;
        this.preview.classList.remove('hidden');
        this.uploadArea.querySelector('.upload-placeholder').style.display = 'none';
    }

    clearPreview() {
        this.currentImage = null;
        this.preview.src = '';
        this.preview.classList.add('hidden');
        this.uploadArea.querySelector('.upload-placeholder').style.display = 'block';
        this.uploadArea.querySelector('.upload-placeholder').innerHTML = `
            <span class="upload-icon">📷</span>
            <p>Click to upload photo</p>
            <p class="upload-hint">Recommended: Square image, at least 800x800px</p>
        `;
        this.fileInput.value = '';
        this.uploadArea.classList.remove('loading');
    }

    async getImageData() {
        return this.currentImage;
    }
}

// Enhanced Authentication Manager
class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.sessionTimeout = null;
    }

    async login(password) {
        // Simulate server authentication
        return new Promise((resolve) => {
            setTimeout(() => {
                // In production, this would be a server call
                const isValid = this.hashPassword(password) === this.getStoredHash();
                
                if (isValid) {
                    this.isAuthenticated = true;
                    this.startSession();
                    sessionStorage.setItem('adminLoggedIn', 'true');
                    sessionStorage.setItem('loginTime', Date.now());
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 500); // Simulate network delay
        });
    }

    logout() {
        this.isAuthenticated = false;
        clearTimeout(this.sessionTimeout);
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('loginTime');
        location.reload();
    }

    checkSession() {
        const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
        const loginTime = parseInt(sessionStorage.getItem('loginTime') || '0');
        
        if (isLoggedIn && loginTime) {
            const elapsed = Date.now() - loginTime;
            if (elapsed < AdminConfig.SESSION_TIMEOUT) {
                this.isAuthenticated = true;
                this.startSession();
                return true;
            }
        }
        
        return false;
    }

    startSession() {
        clearTimeout(this.sessionTimeout);
        this.sessionTimeout = setTimeout(() => {
            AdminUI.showNotification('Session expired. Please log in again.', 'warning');
            this.logout();
        }, AdminConfig.SESSION_TIMEOUT);
    }

    hashPassword(password) {
        // Simple hash for demo - use bcrypt or similar in production
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    getStoredHash() {
        // In production, this would come from server
        return this.hashPassword('pottery123');
    }
}

// Initialize Admin Panel
let adminDataManager, adminUI, authManager;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize managers
    authManager = new AuthManager();
    adminDataManager = new AdminDataManager();
    
    // Check authentication
    if (authManager.checkSession()) {
        initializeAdminPanel();
    } else {
        setupLoginForm();
    }
});

function setupLoginForm() {
    document.getElementById('login-screen').style.display = 'flex';
    
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('admin-password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        const success = await authManager.login(password);
        
        if (success) {
            document.getElementById('login-screen').style.display = 'none';
            initializeAdminPanel();
            AdminUI.showNotification('Welcome back! You\'re now logged in.', 'success');
        } else {
            AdminUI.showNotification('Incorrect password. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });
}

function initializeAdminPanel() {
    document.getElementById('admin-dashboard').classList.remove('hidden');
    
    // Add additional form fields
    enhanceProductForm();
    
    // Initialize UI
    adminUI = new AdminUI(adminDataManager);
    
    // Make UI globally accessible for inline handlers
    window.adminUI = adminUI;
    
    // Make necessary functions globally accessible
    window.editProduct = (id) => adminUI.editProduct(id);
    window.deleteProduct = (id) => adminUI.deleteProduct(id);
    window.duplicateProduct = (id) => adminUI.duplicateProduct(id);
    window.resetProductForm = () => adminUI.resetProductForm();
    window.showSection = (section) => adminUI.showSection(section);
    window.logout = () => authManager.logout();
    window.updateOrderStatus = (orderId, status) => adminUI.updateOrderStatus(orderId, status);
    window.viewOrderDetails = (orderId) => adminUI.viewOrderDetails(orderId);
    window.printPackingSlip = (orderId) => adminUI.printPackingSlip(orderId);
    window.exportProducts = () => adminUI.exportProducts();
    window.exportOrders = () => adminUI.exportOrders();
    window.clearDemoData = () => adminUI.clearDemoData();
    window.showHelp = () => adminUI.showHelp();
    window.closeHelpModal = () => document.getElementById('help-modal')?.classList.add('hidden');
    window.closeEditModal = () => adminUI.resetProductForm();
    
    // Set up order integration
    setupOrderIntegration();
    
    // Show overview
    adminUI.showSection('overview');
}

function enhanceProductForm() {
    // Add new fields to product form
    const storyField = document.querySelector('#product-story').parentElement;
    
    const detailsField = document.createElement('div');
    detailsField.className = 'form-group';
    detailsField.innerHTML = `
        <label>Product Details</label>
        <textarea id="product-details" placeholder="Additional details about this piece..."></textarea>
        <p class="form-hint">Include any special features, care instructions, or unique characteristics</p>
    `;
    storyField.after(detailsField);
    
    const materialsRow = document.createElement('div');
    materialsRow.className = 'form-row';
    materialsRow.innerHTML = `
        <div class="form-group">
            <label>Materials</label>
            <input type="text" id="product-materials" value="100% Porcelain" placeholder="e.g., Porcelain, Stoneware">
        </div>
        <div class="form-group">
            <label>Dimensions</label>
            <input type="text" id="product-dimensions" placeholder="e.g., 8cm x 12cm">
        </div>
    `;
    
    const priceRow = document.querySelector('.form-row');
    priceRow.after(materialsRow);
    
    // Add to settings
    const settingsForm = document.getElementById('shop-settings-form');
    const additionalSettings = document.createElement('div');
    additionalSettings.innerHTML = `
        <div class="form-group">
            <label>
                <input type="checkbox" id="order-notifications" checked>
                Enable order notifications
            </label>
        </div>
        <div class="form-group">
            <label>Low Stock Alert Threshold</label>
            <input type="number" id="low-stock-alert" value="5" min="1" max="100">
            <p class="form-hint">Alert when stock falls below this number</p>
        </div>
    `;
    settingsForm.querySelector('button').before(additionalSettings);
}

function setupOrderIntegration() {
    // Listen for orders from main website
    window.addEventListener('message', (event) => {
        if (event.data.type === 'newOrder' && event.data.order) {
            const order = adminDataManager.addOrder(event.data.order);
            
            if (adminUI && adminUI.currentSection === 'orders') {
                adminUI.displayOrders();
            }
        }
    });
    
    // Also check for orders in localStorage (backup method)
    setInterval(() => {
        const pendingOrders = localStorage.getItem('mccluskeyPendingOrders');
        if (pendingOrders) {
            try {
                const orders = JSON.parse(pendingOrders);
                orders.forEach(order => {
                    // Check if order already exists
                    if (!adminDataManager.data.orders.find(o => o.id === order.id)) {
                        adminDataManager.addOrder(order);
                    }
                });
                
                // Clear processed orders
                localStorage.removeItem('mccluskeyPendingOrders');
                
            } catch (e) {
                console.error('Failed to process pending orders:', e);
            }
        }
    }, 5000); // Check every 5 seconds
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideDown {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(20px); opacity: 0; }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--irish-green);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .drag-hover {
        background: var(--pottery-cream) !important;
        border-color: var(--irish-green) !important;
    }
    
    .loading {
        pointer-events: none;
        opacity: 0.7;
    }
    
    .badge-featured {
        display: inline-block;
        padding: 2px 8px;
        background: var(--terracotta);
        color: white;
        border-radius: 12px;
        font-size: 12px;
        margin-left: 8px;
    }
    
    .badge-custom {
        display: inline-block;
        padding: 2px 8px;
        background: var(--irish-green);
        color: white;
        border-radius: 12px;
        font-size: 12px;
        margin-left: 8px;
    }
    
    .text-muted {
        color: var(--warm-gray);
        font-size: 14px;
    }
    
    .btn-icon {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 5px;
        transition: transform 0.2s;
    }
    
    .btn-icon:hover {
        transform: scale(1.2);
    }
    
    .btn-icon.danger {
        filter: grayscale(100%);
    }
    
    .btn-icon.danger:hover {
        filter: grayscale(0%);
    }
    
    .search-filters {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
        margin-bottom: 20px;
    }
    
    .search-input {
        flex: 1;
        min-width: 200px;
        padding: 10px 15px;
        border: 2px solid #e0e0e0;
        border-radius: 25px;
        font-size: 14px;
    }
    
    .filter-select {
        padding: 10px 15px;
        border: 2px solid #e0e0e0;
        border-radius: 25px;
        font-size: 14px;
        background: white;
    }
    
    .filter-checkbox {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 14px;
    }
    
    .order-address {
        margin-top: 5px;
        font-size: 14px;
        color: var(--warm-gray);
    }
    
    .order-notes {
        margin-top: 15px;
        padding: 15px;
        background: var(--pottery-cream);
        border-radius: 10px;
        font-size: 14px;
    }
    
    .status-history {
        margin-top: 20px;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 10px;
    }
    
    .status-history ul {
        list-style: none;
        padding: 0;
    }
    
    .status-history li {
        padding: 8px 0;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .status-history li:last-child {
        border-bottom: none;
    }
    
    .modal-actions {
        display: flex;
        gap: 15px;
        justify-content: flex-end;
        margin-top: 30px;
    }
    
    .low-stock-alert {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 30px;
    }
    
    .low-stock-alert h3 {
        color: #856404;
        margin-bottom: 10px;
    }
    
    .low-stock-alert ul {
        margin: 0;
        padding-left: 20px;
    }
    
    .revenue-chart {
        background: white;
        padding: 30px;
        border-radius: 20px;
        box-shadow: var(--shadow-soft);
        margin: 30px 0;
    }
    
    .chart-placeholder {
        height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
        border-radius: 10px;
    }
    
    .status-warning { background: #fff3cd; color: #856404; }
    .status-info { background: #cce5ff; color: #004085; }
    .status-success { background: #d4edda; color: #155724; }
    .status-danger { background: #f8d7da; color: #721c24; }
    
    .btn-primary.danger {
        background: #dc3545;
    }
    
    .btn-primary.danger:hover {
        background: #c82333;
    }
`;
document.head.appendChild(style);

// Export for testing
window.AdminSystem = {
    dataManager: adminDataManager,
    ui: adminUI,
    auth: authManager,
    config: AdminConfig
};