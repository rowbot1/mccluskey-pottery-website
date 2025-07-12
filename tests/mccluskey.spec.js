const { test, expect } = require('@playwright/test');
const path = require('path');

// Test configuration
const baseURL = 'file://' + path.resolve(__dirname, '../index.html');
const adminURL = 'file://' + path.resolve(__dirname, '../admin.html');

test.describe('McCluskey Pottery Website', () => {
  test('homepage loads with all key elements', async ({ page }) => {
    await page.goto(baseURL);
    
    // Wait for loader to disappear
    await page.waitForTimeout(2500);
    
    // Check main elements exist
    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.locator('.navbar')).toBeVisible();
    await expect(page.locator('#products-grid')).toBeVisible();
    
    // Check hero text
    const heroTitle = await page.locator('.hero-title').textContent();
    expect(heroTitle).toContain('Every piece');
    expect(heroTitle).toContain('tells a story');
  });

  test('products display correctly', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForTimeout(2500);
    
    // Check products are loaded
    const products = await page.locator('.product-card').count();
    expect(products).toBeGreaterThan(0);
    
    // Check first product has required elements
    const firstProduct = page.locator('.product-card').first();
    await expect(firstProduct.locator('.product-name')).toBeVisible();
    await expect(firstProduct.locator('.product-price')).toBeVisible();
    await expect(firstProduct.locator('.add-to-cart')).toBeVisible();
  });

  test('add to cart functionality works', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForTimeout(2500);
    
    // Cart should start empty
    const initialCount = await page.locator('.cart-count').textContent();
    expect(initialCount).toBe('0');
    
    // Add first product to cart
    await page.locator('.product-card').first().locator('.add-to-cart').click();
    
    // Cart count should update
    await expect(page.locator('.cart-count')).toHaveText('1');
    
    // Notification should appear
    await expect(page.locator('.notification')).toBeVisible();
  });

  test('shopping cart modal works', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForTimeout(2500);
    
    // Add item to cart
    await page.locator('.product-card').first().locator('.add-to-cart').click();
    
    // Open cart
    await page.locator('.cart-icon a').click();
    await expect(page.locator('#cart-modal')).toBeVisible();
    
    // Check cart has items
    await expect(page.locator('.cart-item')).toBeVisible();
    
    // Check total is shown
    await expect(page.locator('#cart-total')).toBeVisible();
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForTimeout(2500);
    
    // Test Collection link
    await page.locator('a[href="#collection"]').click();
    await expect(page.locator('#collection')).toBeInViewport();
    
    // Test Process link
    await page.locator('a[href="#process"]').click();
    await expect(page.locator('#process')).toBeInViewport();
  });

  test('mobile menu works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);
    await page.waitForTimeout(2500);
    
    // Menu toggle should be visible
    await expect(page.locator('.menu-toggle')).toBeVisible();
    
    // Click menu toggle
    await page.locator('.menu-toggle').click();
    
    // Menu should open
    await expect(page.locator('.nav-menu')).toHaveClass(/active/);
  });

  test('admin login works', async ({ page }) => {
    await page.goto(adminURL);
    
    // Login form should be visible
    await expect(page.locator('#login-form')).toBeVisible();
    
    // Try wrong password
    await page.fill('#admin-password', 'wrong');
    await page.locator('#login-form button').click();
    await expect(page.locator('.notification')).toContainText('Incorrect');
    
    // Try correct password
    await page.fill('#admin-password', 'pottery123');
    await page.locator('#login-form button').click();
    
    // Dashboard should appear
    await expect(page.locator('#admin-dashboard')).toBeVisible();
  });

  test('admin can add products', async ({ page }) => {
    await page.goto(adminURL);
    
    // Login
    await page.fill('#admin-password', 'pottery123');
    await page.locator('#login-form button').click();
    
    // Go to add product
    await page.locator('a[data-section="add-product"]').click();
    await expect(page.locator('#add-product-section')).toBeVisible();
    
    // Fill form
    await page.fill('#product-name', 'Test Product');
    await page.fill('#product-story', 'Test story');
    await page.selectOption('#product-category', 'irish');
    await page.fill('#product-price', '25.00');
    
    // Check form fields are filled
    await expect(page.locator('#product-name')).toHaveValue('Test Product');
  });

  test('checkout process works', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForTimeout(2500);
    
    // Add product to cart
    await page.locator('.product-card').first().locator('.add-to-cart').click();
    
    // Open cart and checkout
    await page.locator('.cart-icon a').click();
    await page.locator('.checkout-btn').click();
    
    // Checkout form should appear
    await expect(page.locator('#checkout-modal')).toBeVisible();
    
    // Fill customer info
    await page.fill('#customer-name', 'Test Customer');
    await page.fill('#customer-email', 'test@example.com');
    await page.fill('#customer-address', 'Test Address');
    
    // Submit order
    await page.locator('#checkout-form button[type="submit"]').click();
    
    // Success notification should appear
    await expect(page.locator('.notification')).toContainText('Thank you');
  });

  test('contact form works', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForTimeout(2500);
    
    // Navigate to contact
    await page.locator('a[href="#visit"]').click();
    
    // Fill contact form
    await page.fill('.contact-form input[type="text"]', 'Test Name');
    await page.fill('.contact-form input[type="email"]', 'test@test.com');
    await page.fill('.contact-form textarea', 'Test message');
    
    // Submit
    await page.locator('.contact-form .submit-btn').click();
    
    // Check notification
    await expect(page.locator('.notification')).toContainText('Thank you');
  });
});