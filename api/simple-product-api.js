// Simple Product API for McCluskey Pottery
// This handles everything automatically - no tech knowledge needed!

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();

// Configure file upload
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Image processing and optimization
async function processImage(buffer, filename) {
    const processedImages = {};
    
    // Generate different sizes
    const sizes = {
        thumbnail: { width: 300, height: 300 },
        main: { width: 800, height: 800 },
        large: { width: 1200, height: 1200 }
    };
    
    for (const [sizeName, dimensions] of Object.entries(sizes)) {
        const processed = await sharp(buffer)
            .resize(dimensions.width, dimensions.height, {
                fit: 'inside',
                withoutEnlargement: true,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();
            
        const outputFilename = `${filename}-${sizeName}.jpg`;
        const outputPath = path.join(__dirname, '../images/products', outputFilename);
        
        await sharp(processed).toFile(outputPath);
        processedImages[sizeName] = `images/products/${outputFilename}`;
    }
    
    return processedImages;
}

// AI-powered description enhancement (optional)
async function enhanceDescription(name, category, description) {
    // This could connect to Claude API to enhance descriptions
    // For now, we'll use a simple template
    
    const templates = {
        bowls: "This handcrafted bowl showcases the finest Irish porcelain craftsmanship.",
        mugs: "A perfect companion for your morning tea or coffee, made with love in Limavady.",
        plates: "An elegant piece that brings Irish artistry to your dining table.",
        vases: "A stunning vessel that transforms any space with its graceful form.",
        decorative: "A unique decorative piece that tells its own story.",
        magnets: "A charming reminder of Irish craftsmanship for your home.",
        custom: "A one-of-a-kind piece created especially for you."
    };
    
    const enhanced = description || templates[category] || "A beautiful piece of handcrafted Irish pottery.";
    return `${enhanced} Each piece is unique, shaped by hand on the potter's wheel and fired in our traditional kiln.`;
}

// MAIN UPLOAD ENDPOINT - This is where the magic happens!
app.post('/api/add-pottery', upload.array('photos', 5), async (req, res) => {
    try {
        const { name, price, category, size, description, inStock } = req.body;
        const photos = req.files;
        
        if (!photos || photos.length === 0) {
            return res.status(400).json({ error: 'Please add at least one photo' });
        }
        
        // Generate unique ID for this product
        const productId = uuidv4();
        
        // Process all photos
        const processedPhotos = [];
        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            const filename = `${productId}-photo${i + 1}`;
            const processed = await processImage(photo.buffer, filename);
            processedPhotos.push(processed);
        }
        
        // Enhance description with AI
        const enhancedDescription = await enhanceDescription(name, category, description);
        
        // Create product in Stripe
        const stripeProduct = await stripe.products.create({
            name: name,
            description: enhancedDescription,
            images: [processedPhotos[0].large], // Use first image for Stripe
            metadata: {
                category: category,
                size: size || '',
                productId: productId
            }
        });
        
        // Create price in Stripe
        const stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: Math.round(parseFloat(price) * 100), // Convert to pence
            currency: 'gbp'
        });
        
        // Save to local database
        const productData = {
            id: productId,
            name: name,
            price: parseFloat(price),
            category: category,
            size: size,
            description: enhancedDescription,
            images: processedPhotos,
            inStock: inStock === 'true',
            stripeProductId: stripeProduct.id,
            stripePriceId: stripePrice.id,
            createdAt: new Date().toISOString()
        };
        
        // Read existing products
        const productsFile = path.join(__dirname, '../data/products.json');
        let products = [];
        try {
            const data = await fs.readFile(productsFile, 'utf8');
            products = JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet, that's ok
        }
        
        // Add new product
        products.unshift(productData); // Add to beginning
        
        // Save updated products
        await fs.writeFile(productsFile, JSON.stringify(products, null, 2));
        
        // Update the website automatically
        await updateWebsiteProducts(products);
        
        res.json({
            success: true,
            message: 'Product added successfully!',
            product: productData
        });
        
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({
            error: 'Something went wrong. Please try again.'
        });
    }
});

// Function to automatically update the website
async function updateWebsiteProducts(products) {
    // Generate new products-data.js file
    const jsContent = `// Auto-generated product data - DO NOT EDIT MANUALLY
// Last updated: ${new Date().toISOString()}

const mccluskeyProducts = ${JSON.stringify(products.map(p => ({
    id: p.id,
    name: p.name,
    story: p.description,
    price: p.price,
    category: p.category,
    image: p.images[0].main,
    images: p.images.map(img => img.main),
    featured: false,
    details: p.size || 'Handcrafted in Limavady',
    stock: p.inStock ? 10 : 0
})), null, 2)};

// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = mccluskeyProducts;
}`;

    await fs.writeFile(path.join(__dirname, '../js/products-data.js'), jsContent);
    
    // Also update a simple products.html page
    const htmlContent = await generateProductsHTML(products);
    await fs.writeFile(path.join(__dirname, '../products.html'), htmlContent);
}

// Generate simple products HTML
function generateProductsHTML(products) {
    const productCards = products.map(product => `
        <div class="product-card" data-category="${product.category}">
            <div class="product-image">
                <img src="${product.images[0].main}" alt="${product.name}" loading="lazy">
                ${!product.inStock ? '<span class="sold-badge">Sold</span>' : ''}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-size">${product.size || ''}</p>
                <p class="product-price">£${product.price.toFixed(2)}</p>
                ${product.inStock ? 
                    `<button class="add-to-cart-btn" data-product-id="${product.id}">Add to Basket</button>` :
                    `<button class="sold-out-btn" disabled>Sold Out</button>`
                }
            </div>
        </div>
    `).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All Products - McCluskey Pottery</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <h1>Our Collection</h1>
    <div class="products-grid">
        ${productCards}
    </div>
    <script src="js/main.js"></script>
</body>
</html>`;
}

// Simple endpoint to get all products
app.get('/api/products', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, '../data/products.json'), 'utf8');
        const products = JSON.parse(data);
        res.json(products);
    } catch (error) {
        res.json([]);
    }
});

// Mark product as sold
app.post('/api/product/:id/sold', async (req, res) => {
    try {
        const productId = req.params.id;
        const data = await fs.readFile(path.join(__dirname, '../data/products.json'), 'utf8');
        let products = JSON.parse(data);
        
        const product = products.find(p => p.id === productId);
        if (product) {
            product.inStock = false;
            await fs.writeFile(path.join(__dirname, '../data/products.json'), JSON.stringify(products, null, 2));
            await updateWebsiteProducts(products);
            
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✨ McCluskey Pottery API running on port ${PORT}`);
});