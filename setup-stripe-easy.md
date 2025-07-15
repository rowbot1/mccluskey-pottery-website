# 🚀 Super Easy Stripe Setup for McCluskey Pottery

I've done all the heavy lifting! Just follow these 3 simple steps:

## Step 1: Get Your Stripe Keys (2 minutes)

1. **Create Stripe Account** (if you haven't already):
   - Go to [stripe.com](https://stripe.com)
   - Click "Start now"
   - Enter email and create password

2. **Get Your Test Keys**:
   - Log into [Stripe Dashboard](https://dashboard.stripe.com)
   - You'll see a banner at the top saying "Test mode"
   - Click **"Developers"** → **"API keys"**
   - You'll see two keys:
     - **Publishable key**: `pk_test_...` (safe to share)
     - **Secret key**: `sk_test_...` (keep private!)

## Step 2: Add Keys to Your Project (1 minute)

1. Create a file called `.env` in your project folder
2. Copy and paste this, replacing with your actual keys:

```bash
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

## Step 3: Run My Magic Script (1 minute)

Open terminal in your project folder and run:

```bash
# Install required packages (one time only)
npm install

# Run the setup script
npm run setup-stripe
```

## 🎉 That's It! 

The script will automatically:
- ✅ Create all 6 products in Stripe
- ✅ Set up prices in GBP (£)
- ✅ Create shipping rates (UK, Ireland, International)
- ✅ Add VAT tax rate (20%)
- ✅ Save all IDs to `stripe-products.json`

## What You'll See:

```
🎯 Starting Stripe product setup...

📦 Creating products...
✅ Created product: Porcelain Irish Swallow
💷 Created price: £48 for Porcelain Irish Swallow
✅ Created product: Framed Porcelain Irish Cottage - Blue Door
💷 Created price: £48 for Framed Porcelain Irish Cottage - Blue Door
... (and so on)

🚚 Creating shipping rates...
✅ Created shipping rate: Standard Shipping (UK)
✅ Created shipping rate: Standard Shipping (Ireland)
✅ Created shipping rate: International Shipping
✅ Created shipping rate: Express Shipping (UK)

💶 Creating tax rates...
✅ Created tax rate: VAT (20%)

✨ Setup complete! Results saved to stripe-products.json
```

## Check Your Products:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **"Products"** in the left menu
3. You'll see all your pottery products there! 🎨

## Troubleshooting:

**"Cannot find module 'stripe'"**
- Run: `npm install`

**"Invalid API Key provided"**
- Make sure you copied the full key including `sk_test_`
- Check there are no extra spaces

**"This API key is not valid for this environment"**
- Make sure you're using test keys (start with `_test_`)
- Not live keys (which start with `_live_`)

## Next Steps:

Once everything is created, I can:
1. Add the checkout to your website
2. Set up order processing
3. Add customer receipts
4. Create an order management page

Just let me know when you've run the script!