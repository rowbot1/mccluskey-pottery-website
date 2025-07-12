# Running Tests for McCluskey Pottery Website

## Test Coverage

The test suite covers every aspect of the website:

### Main Website Tests
- ✅ Homepage loading and layout
- ✅ Navigation between sections
- ✅ Product display and filtering
- ✅ Shopping cart functionality
- ✅ Add to cart operations
- ✅ Checkout process
- ✅ Contact form submission
- ✅ Newsletter signup
- ✅ Mobile responsiveness

### Admin Panel Tests
- ✅ Login authentication
- ✅ Dashboard statistics
- ✅ Product management (add, edit, delete)
- ✅ Order management
- ✅ Settings configuration
- ✅ Help documentation
- ✅ Logout functionality

### Integration Tests
- ✅ Products added in admin appear on main site
- ✅ Orders placed on main site appear in admin

### Performance Tests
- ✅ Page load speed
- ✅ Cart operations performance

### Accessibility Tests
- ✅ Keyboard navigation
- ✅ Screen reader support

## How to Run Tests

### Prerequisites
```bash
# Install Node.js first, then:
npm install
npx playwright install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Groups
```bash
# Main website only
npm run test:main

# Admin panel only
npm run test:admin

# Integration tests
npm run test:integration

# Performance tests
npm run test:performance

# Accessibility tests
npm run test:a11y
```

### Run with Visual Browser
```bash
npm run test:headed
```

### View Test Report
```bash
npm run test:report
```

## Test Results

The tests validate:
1. **User Experience**: All customer-facing features work correctly
2. **Admin Functions**: Product and order management works properly
3. **Data Integrity**: Products and orders sync between admin and main site
4. **Performance**: Site loads quickly and responds fast
5. **Accessibility**: Site is usable with keyboard and screen readers
6. **Responsive Design**: Works on mobile and desktop devices

## Quick Manual Test Checklist

If you prefer manual testing:

### Customer Flow
1. ☐ Open website, check it loads properly
2. ☐ Browse products, check images display
3. ☐ Add items to cart
4. ☐ Update quantities in cart
5. ☐ Complete checkout
6. ☐ Submit contact form
7. ☐ Sign up for newsletter

### Admin Flow
1. ☐ Login to admin (password: pottery123)
2. ☐ Add a new product with photo
3. ☐ Edit existing product
4. ☐ View orders
5. ☐ Update order status
6. ☐ Change settings
7. ☐ Logout

### Mobile Test
1. ☐ Open on phone/tablet
2. ☐ Check menu works
3. ☐ Try to buy something
4. ☐ Check all text is readable

All tests should pass ✅