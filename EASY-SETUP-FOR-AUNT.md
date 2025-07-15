# 📱 Super Easy Setup - McCluskey Pottery Upload System

## What This Does
This lets you add new pottery to your website by simply taking photos on your phone!

## One-Time Setup (5 minutes)

### Step 1: Get Your Stripe Account
1. Go to [stripe.com](https://stripe.com) and click "Start now"
2. Enter your email and create a password
3. Follow the setup wizard (you can skip most steps for now)

### Step 2: Get Your Secret Keys
1. Log into Stripe Dashboard
2. Click "Developers" → "API keys"
3. Copy the two keys that start with `pk_test_` and `sk_test_`

### Step 3: Run Setup
1. Open Terminal (ask your nephew to help with this part)
2. Type these commands:
```bash
cd ~/Downloads/mccluskey-pottery-website
node setup-upload-system.js
```

3. Edit the `.env` file and paste your Stripe keys

### Step 4: Start the System
```bash
npm run start-api
```

## 📱 How to Add New Pottery

### On Your Phone:
1. Open Safari/Chrome
2. Go to: `http://localhost:3000/add-pottery-mobile.html`
3. Save this as a bookmark!

### Adding a Piece:
1. **Tap the camera icon** - Take photos or choose from gallery
2. **Name it** - Like "Blue Swallow Bowl"
3. **Set price** - Just type the number (48.50)
4. **Pick type** - Tap Bowl, Mug, Plate, etc.
5. **Tap "Add to Website"** - That's it!

## 🎉 Your pottery is now on the website!

## Tips:
- Take photos in good light
- You can add multiple photos per piece
- The "story" field is optional but nice
- Mark as "not available" if it's already sold

## If Something Goes Wrong:
1. Make sure the terminal window is still running
2. Refresh the page and try again
3. Call your nephew! 😊

## To Stop the System:
Press `Ctrl+C` in the Terminal window

## To Start Again Later:
```bash
cd ~/Downloads/mccluskey-pottery-website
npm run start-api
```
Then open your bookmarked page!