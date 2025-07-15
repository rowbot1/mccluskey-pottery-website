// Setup script to create all McCluskey Pottery products in Stripe
// Run this once to create all products automatically

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs').promises;

// Product data from your website
const products = [
  {
    name: "Porcelain Irish Swallow",
    description: "The beloved swallow returns each spring to Ireland, bringing hope and renewal. This traditional scene captures their graceful flight in fine porcelain.",
    price: 48.00,
    images: ["https://mccluskeypottery.com/images/swallow-main.jpg"],
    metadata: {
      category: "irish",
      details: "7.5 inches x 1.25 inches (19 x 3 cm), presented on blue or beige mount with white frame",
      featured: "true"
    }
  },
  {
    name: "Framed Porcelain Irish Cottage - Blue Door",
    description: "A charming traditional Irish cottage with its distinctive blue door. This scene could be found anywhere across Ireland's beautiful countryside.",
    price: 48.00,
    images: ["https://mccluskeypottery.com/images/cottage-blue-main.png"],
    metadata: {
      category: "irish",
      details: "6.5 inches (16 cm), mounted on quality frame"
    }
  },
  {
    name: "Framed Porcelain Irish Cottage Scene",
    description: "Traditional Irish cottage nestled in the countryside, capturing the warmth and character of rural Irish life in exquisite porcelain detail.",
    price: 48.00,
    images: ["https://mccluskeypottery.com/images/cottage-scene.png"],
    metadata: {
      category: "irish",
      details: "6.5 inches (16 cm), beautifully framed"
    }
  },
  {
    name: "Framed Porcelain Mountain Scene",
    description: "Ireland's majestic mountains captured in delicate porcelain, with a traditional cottage in the foreground surrounded by emerald green fields.",
    price: 48.00,
    images: ["https://mccluskeypottery.com/images/mountain-scene-main.png"],
    metadata: {
      category: "irish",
      details: "6.5 inches (16 cm), presented in elegant frame",
      featured: "true"
    }
  },
  {
    name: "Fáilte Magnet - Green",
    description: "A warm Irish welcome for your home. 'Fáilte' means welcome in Irish - perfect for your fridge or any magnetic surface.",
    price: 9.95,
    images: ["https://mccluskeypottery.com/images/failte-green.png"],
    metadata: {
      category: "irish",
      details: "1 inch (2.5 cm) porcelain magnet"
    }
  },
  {
    name: "Fáilte Magnet - Blue",
    description: "Traditional Irish welcome in beautiful blue. A small piece of Ireland to brighten your day.",
    price: 9.95,
    images: ["https://mccluskeypottery.com/images/failte-blue.png"],
    metadata: {
      category: "irish",
      details: "1 inch (2.5 cm) porcelain magnet"
    }
  }
];

// Shipping rates configuration
const shippingRates = [
  {
    display_name: "Standard Shipping (UK)",
    type: "fixed_amount",
    fixed_amount: {
      amount: 495, // £4.95
      currency: "gbp",
    },
    delivery_estimate: {
      minimum: { unit: "business_day", value: 3 },
      maximum: { unit: "business_day", value: 5 },
    },
    metadata: {
      country: "UK"
    }
  },
  {
    display_name: "Standard Shipping (Ireland)",
    type: "fixed_amount",
    fixed_amount: {
      amount: 695, // £6.95
      currency: "gbp",
    },
    delivery_estimate: {
      minimum: { unit: "business_day", value: 5 },
      maximum: { unit: "business_day", value: 7 },
    },
    metadata: {
      country: "Ireland"
    }
  },
  {
    display_name: "International Shipping",
    type: "fixed_amount",
    fixed_amount: {
      amount: 1495, // £14.95
      currency: "gbp",
    },
    delivery_estimate: {
      minimum: { unit: "business_day", value: 7 },
      maximum: { unit: "business_day", value: 14 },
    },
    metadata: {
      country: "International"
    }
  },
  {
    display_name: "Express Shipping (UK)",
    type: "fixed_amount",
    fixed_amount: {
      amount: 995, // £9.95
      currency: "gbp",
    },
    delivery_estimate: {
      minimum: { unit: "business_day", value: 1 },
      maximum: { unit: "business_day", value: 2 },
    },
    metadata: {
      country: "UK",
      express: "true"
    }
  }
];

async function setupStripeProducts() {
  console.log('🎯 Starting Stripe product setup...\n');
  
  const results = {
    products: [],
    prices: [],
    shippingRates: [],
    errors: []
  };

  try {
    // 1. Create Products and Prices
    console.log('📦 Creating products...');
    
    for (const productData of products) {
      try {
        // Create product
        const product = await stripe.products.create({
          name: productData.name,
          description: productData.description,
          images: productData.images,
          metadata: productData.metadata,
          shippable: true,
          url: `https://mccluskeypottery.com/products/${productData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        
        console.log(`✅ Created product: ${product.name}`);
        results.products.push(product);
        
        // Create price for the product
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(productData.price * 100), // Convert to pence
          currency: 'gbp',
          metadata: {
            product_name: productData.name
          }
        });
        
        console.log(`💷 Created price: £${productData.price} for ${product.name}`);
        results.prices.push(price);
        
      } catch (error) {
        console.error(`❌ Error creating ${productData.name}:`, error.message);
        results.errors.push({ product: productData.name, error: error.message });
      }
    }
    
    // 2. Create Shipping Rates
    console.log('\n🚚 Creating shipping rates...');
    
    for (const rateData of shippingRates) {
      try {
        const shippingRate = await stripe.shippingRates.create(rateData);
        console.log(`✅ Created shipping rate: ${shippingRate.display_name}`);
        results.shippingRates.push(shippingRate);
      } catch (error) {
        console.error(`❌ Error creating shipping rate:`, error.message);
        results.errors.push({ shipping: rateData.display_name, error: error.message });
      }
    }
    
    // 3. Create a Tax Rate for VAT (if needed)
    console.log('\n💶 Creating tax rates...');
    try {
      const taxRate = await stripe.taxRates.create({
        display_name: 'VAT',
        description: 'UK VAT',
        jurisdiction: 'GB',
        percentage: 20,
        inclusive: false,
      });
      console.log(`✅ Created tax rate: ${taxRate.display_name} (${taxRate.percentage}%)`);
      results.taxRate = taxRate;
    } catch (error) {
      console.error(`❌ Error creating tax rate:`, error.message);
      results.errors.push({ tax: 'VAT', error: error.message });
    }
    
    // 4. Save results to file
    const output = {
      created_at: new Date().toISOString(),
      products: results.products.map(p => ({
        id: p.id,
        name: p.name,
        stripe_dashboard_url: `https://dashboard.stripe.com/products/${p.id}`
      })),
      prices: results.prices.map(p => ({
        id: p.id,
        product_id: p.product,
        amount: p.unit_amount,
        currency: p.currency
      })),
      shipping_rates: results.shippingRates.map(s => ({
        id: s.id,
        display_name: s.display_name,
        amount: s.fixed_amount.amount
      })),
      tax_rate: results.taxRate ? {
        id: results.taxRate.id,
        percentage: results.taxRate.percentage
      } : null,
      errors: results.errors
    };
    
    await fs.writeFile('stripe-products.json', JSON.stringify(output, null, 2));
    
    console.log('\n✨ Setup complete! Results saved to stripe-products.json');
    console.log(`\n📊 Summary:`);
    console.log(`   - Products created: ${results.products.length}`);
    console.log(`   - Prices created: ${results.prices.length}`);
    console.log(`   - Shipping rates created: ${results.shippingRates.length}`);
    console.log(`   - Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      results.errors.forEach(err => console.log(`   - ${JSON.stringify(err)}`));
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

// Run the setup
setupStripeProducts();