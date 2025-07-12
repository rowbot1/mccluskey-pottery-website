// McCluskey Pottery E2E Tests with Playwright
const { test, expect } = require('@playwright/test');
const path = require('path');

// Test configuration
const baseURL = 'file://' + path.resolve(__dirname, '../index.html');
const adminURL = 'file://' + path.resolve(__dirname, '../admin.html');
const testPassword = 'pottery123';

// Test data
const testProduct = {
    name: 'Test Porcelain Piece',
    story: 'A beautiful test piece for our automated tests',
    category: 'irish',
    price: '25.99',
    stock: '10',
    badge: 'Test Item'
};

const testCustomer = {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+44 7700 900000',
    address: '123 Test Street\nBelfast, BT1 1AA\nNorthern Ireland',
    notes: 'Please handle with care'
};

test.describe('McCluskey Pottery Website Tests', () => {
    
    // Main Website Tests
    test.describe('Main Website', () => {
        
        test('Homepage loads correctly', async ({ page }) => {
            await page.goto(baseURL);
            
            // Check main elements
            await expect(page.locator('.hero-title')).toContainText('Every piece tells a story');
            await expect(page.locator('.navbar')).toBeVisible();
            await expect(page.locator('#products-grid')).toBeVisible();
            
            // Check loader disappears
            await page.waitForTimeout(2500);
            await expect(page.locator('.loader')).toHaveClass(/hidden/);
        });

        test('Navigation works correctly', async ({ page }) => {
            await page.goto(baseURL);
            await page.waitForTimeout(2500); // Wait for loader
            
            // Test navigation links
            const navLinks = ['Collection', 'Process', 'Stories', 'Visit'];
            
            for (const linkText of navLinks) {
                await page.click(`text=${linkText}`);
                await page.waitForTimeout(500);
                const section = linkText.toLowerCase();
                await expect(page.locator(`#${section}`)).toBeInViewport();
            }
        });

        test('Products display correctly', async ({ page }) => {
            await page.goto(baseURL);
            await page.waitForTimeout(2500);
            
            // Check products are loaded
            const products = page.locator('.product-card');
            await expect(products).toHaveCount(6); // Based on products-data.js
            
            // Check first product details
            const firstProduct = products.first();
            await expect(firstProduct.locator('.product-name')).toContainText('Porcelain Irish Swallow');
            await expect(firstProduct.locator('.product-price')).toContainText('£48.00');
            await expect(firstProduct.locator('.add-to-cart')).toBeVisible();
        });

        test('Product filtering works', async ({ page }) => {
            await page.goto(baseURL);
            await page.waitForTimeout(2500);
            
            // Click on Collection section
            await page.click('text=Collection');
            await page.waitForTimeout(500);
            
            // Test filter buttons
            const filterButtons = page.locator('.filter-btn');
            await expect(filterButtons).toHaveCount(4);
            
            // Filter by category (all products are 'irish' in test data)
            await page.click('.filter-btn:has-text("Irish Traditions")');
            await page.waitForTimeout(500);
            
            const visibleProducts = page.locator('.product-card');
            await expect(visibleProducts).toHaveCount(6);
        });

        test('Add to cart functionality', async ({ page }) => {
            await page.goto(baseURL);
            await page.waitForTimeout(2500);
            
            // Initial cart should be empty
            await expect(page.locator('.cart-count')).toHaveText('0');
            
            // Add first product to cart
            await page.click('.product-card:first-child .add-to-cart');
            await page.waitForTimeout(500);
            
            // Check cart count updated
            await expect(page.locator('.cart-count')).toHaveText('1');
            
            // Check notification appears
            await expect(page.locator('.notification')).toBeVisible();
            await expect(page.locator('.notification')).toContainText('added to cart');
        });

        test('Shopping cart modal', async ({ page }) => {
            await page.goto(baseURL);
            await page.waitForTimeout(2500);
            
            // Add product to cart
            await page.click('.product-card:first-child .add-to-cart');
            await page.waitForTimeout(500);
            
            // Open cart
            await page.click('.cart-icon a');
            await expect(page.locator('#cart-modal')).toBeVisible();
            
            // Check cart contents
            await expect(page.locator('.cart-item')).toHaveCount(1);
            await expect(page.locator('#cart-total')).toContainText('£48.00');
            
            // Test quantity update
            await page.click('.quantity-btn:has-text("+")');
            await page.waitForTimeout(300);
            await expect(page.locator('#cart-total')).toContainText('£96.00');
            
            // Test remove item
            await page.click('.remove-item');
            await page.waitForTimeout(300);
            await expect(page.locator('.cart-items')).toContainText('Your collection is empty');
        });

        test('Checkout process', async ({ page }) => {
            await page.goto(baseURL);
            await page.waitForTimeout(2500);
            
            // Add products to cart
            await page.click('.product-card:first-child .add-to-cart');
            await page.click('.product-card:nth-child(2) .add-to-cart');
            await page.waitForTimeout(500);
            
            // Open cart and checkout
            await page.click('.cart-icon a');
            await page.click('.checkout-btn');
            
            // Check checkout form appears
            await expect(page.locator('#checkout-modal')).toBeVisible();
            
            // Fill checkout form
            await page.fill('#customer-name', testCustomer.name);
            await page.fill('#customer-email', testCustomer.email);
            await page.fill('#customer-phone', testCustomer.phone);
            await page.fill('#customer-address', testCustomer.address);
            await page.fill('#order-notes', testCustomer.notes);
            
            // Submit order
            await page.click('#checkout-form button[type="submit"]');
            await page.waitForTimeout(1000);
            
            // Check success notification
            await expect(page.locator('.notification')).toContainText('Thank you for your order');
            
            // Check cart is cleared
            await expect(page.locator('.cart-count')).toHaveText('0');
        });

        test('Contact form submission', async ({ page }) => {
            await page.goto(baseURL);
            await page.waitForTimeout(2500);
            
            // Navigate to contact section
            await page.click('text=Visit');
            await page.waitForTimeout(500);
            
            // Fill contact form
            await page.fill('.contact-form input[type="text"]', 'Test User');
            await page.fill('.contact-form input[type="email"]', 'test@example.com');
            await page.fill('.contact-form textarea', 'Test message');
            
            // Submit form
            await page.click('.contact-form .submit-btn');
            await page.waitForTimeout(500);
            
            // Check notification
            await expect(page.locator('.notification')).toContainText('Thank you for your message');
        });

        test('Newsletter signup', async ({ page }) => {
            await page.goto(baseURL);
            await page.waitForTimeout(2500);
            
            // Scroll to newsletter
            await page.evaluate(() => {
                document.querySelector('.newsletter').scrollIntoView();
            });
            
            // Fill newsletter form
            await page.fill('.newsletter-form input[type="email"]', 'newsletter@example.com');
            await page.click('.newsletter-form button');
            
            // Check notification
            await expect(page.locator('.notification')).toContainText('Welcome to our circle');
        });

        test('Mobile responsiveness', async ({ page }) => {
            // Set mobile viewport
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto(baseURL);
            await page.waitForTimeout(2500);
            
            // Check mobile menu toggle is visible
            await expect(page.locator('.menu-toggle')).toBeVisible();
            
            // Test mobile menu
            await page.click('.menu-toggle');
            await expect(page.locator('.nav-menu')).toHaveClass(/active/);
            
            // Check products stack properly
            const productGrid = page.locator('#products-grid');
            const gridStyles = await productGrid.evaluate(el => 
                window.getComputedStyle(el).gridTemplateColumns
            );
            expect(gridStyles).toContain('1fr');
        });
    });

    // Admin Panel Tests
    test.describe('Admin Panel', () => {
        
        test('Admin login', async ({ page }) => {
            await page.goto(adminURL);
            
            // Check login screen
            await expect(page.locator('#login-screen')).toBeVisible();
            
            // Try wrong password
            await page.fill('#admin-password', 'wrongpassword');
            await page.click('#login-form button');
            await expect(page.locator('.notification')).toContainText('Incorrect password');
            
            // Login with correct password
            await page.fill('#admin-password', testPassword);
            await page.click('#login-form button');
            
            // Check dashboard appears
            await expect(page.locator('#admin-dashboard')).toBeVisible();
            await expect(page.locator('#login-screen')).not.toBeVisible();
        });

        test('Admin dashboard statistics', async ({ page }) => {
            await page.goto(adminURL);
            await page.fill('#admin-password', testPassword);
            await page.click('#login-form button');
            
            // Check statistics are displayed
            await expect(page.locator('#total-products')).toBeVisible();
            await expect(page.locator('#total-orders')).toBeVisible();
            await expect(page.locator('#total-revenue')).toBeVisible();
            await expect(page.locator('#best-seller')).toBeVisible();
        });

        test('Add new product', async ({ page }) => {
            await page.goto(adminURL);
            await page.fill('#admin-password', testPassword);
            await page.click('#login-form button');
            
            // Navigate to add product
            await page.click('.nav-item[data-section="add-product"]');
            await expect(page.locator('#add-product-section')).toBeVisible();
            
            // Fill product form
            await page.fill('#product-name', testProduct.name);
            await page.fill('#product-story', testProduct.story);
            await page.selectOption('#product-category', testProduct.category);
            await page.fill('#product-price', testProduct.price);
            await page.fill('#product-stock', testProduct.stock);
            await page.fill('#product-badge', testProduct.badge);
            await page.check('#product-featured');
            
            // Upload image (simulate with a test file)
            const fileInput = page.locator('#product-image');
            // Create a simple test image
            await fileInput.setInputFiles({
                name: 'test-image.jpg',
                mimeType: 'image/jpeg',
                buffer: Buffer.from('fake-image-data')
            });
            
            // Submit form
            await page.click('#add-product-form button[type="submit"]');
            await page.waitForTimeout(1000);
            
            // Check success notification
            await expect(page.locator('.notification')).toContainText('Product added successfully');
        });

        test('View and manage products', async ({ page }) => {
            await page.goto(adminURL);
            await page.fill('#admin-password', testPassword);
            await page.click('#login-form button');
            
            // Navigate to products
            await page.click('.nav-item[data-section="products"]');
            await expect(page.locator('#products-section')).toBeVisible();
            
            // Check products table
            const productRows = page.locator('.products-table tbody tr');
            const rowCount = await productRows.count();
            expect(rowCount).toBeGreaterThan(0);
            
            // Test edit button (if products exist)
            if (rowCount > 0) {
                await page.click('.btn-edit:first-child');
                await expect(page.locator('#add-product-section')).toBeVisible();
                await expect(page.locator('#product-name')).not.toBeEmpty();
            }
        });

        test('Order management', async ({ page }) => {
            await page.goto(adminURL);
            await page.fill('#admin-password', testPassword);
            await page.click('#login-form button');
            
            // Navigate to orders
            await page.click('.nav-item[data-section="orders"]');
            await expect(page.locator('#orders-section')).toBeVisible();
            
            // Test order filters
            const filterButtons = page.locator('.orders-filters .filter-btn');
            await expect(filterButtons).toHaveCount(4);
            
            // Click each filter
            await page.click('.filter-btn[data-status="pending"]');
            await page.waitForTimeout(300);
            await page.click('.filter-btn[data-status="processing"]');
            await page.waitForTimeout(300);
            await page.click('.filter-btn[data-status="completed"]');
        });

        test('Settings management', async ({ page }) => {
            await page.goto(adminURL);
            await page.fill('#admin-password', testPassword);
            await page.click('#login-form button');
            
            // Navigate to settings
            await page.click('.nav-item[data-section="settings"]');
            await expect(page.locator('#settings-section')).toBeVisible();
            
            // Update settings
            await page.fill('#shop-email', 'newemail@mccluskeypottery.ie');
            await page.fill('#shop-phone', '+44 28 7777 1111');
            await page.fill('#shipping-message', 'Updated shipping message');
            
            // Save settings
            await page.click('#shop-settings-form button[type="submit"]');
            await expect(page.locator('.notification')).toContainText('Settings saved successfully');
        });

        test('Help modal', async ({ page }) => {
            await page.goto(adminURL);
            await page.fill('#admin-password', testPassword);
            await page.click('#login-form button');
            
            // Open help
            await page.click('text=View Tutorial');
            await expect(page.locator('#help-modal')).toBeVisible();
            
            // Check help content
            await expect(page.locator('.help-content')).toContainText('Getting Started Guide');
            
            // Close help
            await page.click('#help-modal .modal-close');
            await expect(page.locator('#help-modal')).toHaveClass(/hidden/);
        });

        test('Logout functionality', async ({ page }) => {
            await page.goto(adminURL);
            await page.fill('#admin-password', testPassword);
            await page.click('#login-form button');
            
            // Logout
            await page.click('.logout-btn');
            
            // Should return to login screen
            await expect(page.locator('#login-screen')).toBeVisible();
            await expect(page.locator('#admin-dashboard')).toHaveClass(/hidden/);
        });
    });

    // Integration Tests
    test.describe('Integration Tests', () => {
        
        test('Product added in admin appears on main site', async ({ browser }) => {
            const context = await browser.newContext();
            
            // Add product in admin
            const adminPage = await context.newPage();
            await adminPage.goto(adminURL);
            await adminPage.fill('#admin-password', testPassword);
            await adminPage.click('#login-form button');
            
            // Count initial products
            const mainPage = await context.newPage();
            await mainPage.goto(baseURL);
            await mainPage.waitForTimeout(2500);
            const initialCount = await mainPage.locator('.product-card').count();
            
            // Add new product in admin
            await adminPage.click('.nav-item[data-section="add-product"]');
            await adminPage.fill('#product-name', 'Integration Test Product');
            await adminPage.fill('#product-story', 'Test story');
            await adminPage.selectOption('#product-category', 'irish');
            await adminPage.fill('#product-price', '99.99');
            await adminPage.fill('#product-stock', '5');
            
            const fileInput = adminPage.locator('#product-image');
            await fileInput.setInputFiles({
                name: 'test.jpg',
                mimeType: 'image/jpeg',
                buffer: Buffer.from('test')
            });
            
            await adminPage.click('#add-product-form button[type="submit"]');
            await adminPage.waitForTimeout(1000);
            
            // Refresh main page and check new product appears
            await mainPage.reload();
            await mainPage.waitForTimeout(2500);
            const newCount = await mainPage.locator('.product-card').count();
            expect(newCount).toBe(initialCount + 1);
            
            await context.close();
        });

        test('Order placed on main site appears in admin', async ({ browser }) => {
            const context = await browser.newContext();
            
            // Open both pages
            const mainPage = await context.newPage();
            const adminPage = await context.newPage();
            
            // Login to admin
            await adminPage.goto(adminURL);
            await adminPage.fill('#admin-password', testPassword);
            await adminPage.click('#login-form button');
            await adminPage.click('.nav-item[data-section="orders"]');
            
            // Place order on main site
            await mainPage.goto(baseURL);
            await mainPage.waitForTimeout(2500);
            await mainPage.click('.product-card:first-child .add-to-cart');
            await mainPage.click('.cart-icon a');
            await mainPage.click('.checkout-btn');
            
            await mainPage.fill('#customer-name', 'Integration Test');
            await mainPage.fill('#customer-email', 'integration@test.com');
            await mainPage.fill('#customer-address', 'Test Address');
            await mainPage.click('#checkout-form button[type="submit"]');
            await mainPage.waitForTimeout(1000);
            
            // Check order appears in admin
            await adminPage.reload();
            await adminPage.click('.nav-item[data-section="orders"]');
            await expect(adminPage.locator('.order-card')).toContainText('Integration Test');
            
            await context.close();
        });
    });

    // Performance Tests
    test.describe('Performance Tests', () => {
        
        test('Page load performance', async ({ page }) => {
            const startTime = Date.now();
            await page.goto(baseURL);
            await page.waitForLoadState('networkidle');
            const loadTime = Date.now() - startTime;
            
            // Page should load within 3 seconds
            expect(loadTime).toBeLessThan(3000);
        });

        test('Cart operations performance', async ({ page }) => {
            await page.goto(baseURL);
            await page.waitForTimeout(2500);
            
            const startTime = Date.now();
            
            // Add multiple items quickly
            for (let i = 0; i < 5; i++) {
                await page.click(`.product-card:nth-child(${i + 1}) .add-to-cart`);
            }
            
            const operationTime = Date.now() - startTime;
            
            // Operations should complete within 2 seconds
            expect(operationTime).toBeLessThan(2000);
            
            // Verify cart count
            await expect(page.locator('.cart-count')).toHaveText('5');
        });
    });

    // Accessibility Tests
    test.describe('Accessibility Tests', () => {
        
        test('Keyboard navigation', async ({ page }) => {
            await page.goto(baseURL);
            await page.waitForTimeout(2500);
            
            // Tab through navigation
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
            
            // Should be able to activate links with Enter
            await page.keyboard.press('Enter');
            await page.waitForTimeout(500);
            
            // Check focus indicators exist
            const focusedElement = await page.evaluate(() => {
                return document.activeElement.tagName;
            });
            expect(focusedElement).toBeTruthy();
        });

        test('Screen reader labels', async ({ page }) => {
            await page.goto(baseURL);
            
            // Check important elements have accessible labels
            const cartLink = page.locator('.cart-icon a');
            await expect(cartLink).toHaveAttribute('href', '#cart');
            
            // Check images have alt text
            const images = page.locator('img');
            const imageCount = await images.count();
            
            for (let i = 0; i < imageCount; i++) {
                const img = images.nth(i);
                const altText = await img.getAttribute('alt');
                expect(altText).toBeTruthy();
            }
        });
    });
});

// Test runner configuration
module.exports = {
    testDir: '.',
    timeout: 30000,
    retries: 1,
    use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
    },
};