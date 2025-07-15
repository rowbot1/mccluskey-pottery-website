# ☁️ Deploy to Cloud (For Production Use)

## Option 1: Deploy to Render (Recommended - FREE)

1. **Push to GitHub**:
```bash
git add .
git commit -m "Add pottery upload system"
git push
```

2. **Deploy on Render**:
- Go to [render.com](https://render.com)
- Sign up with GitHub
- Click "New +" → "Web Service"
- Connect your GitHub repo
- Settings:
  - Name: `mccluskey-pottery-api`
  - Build Command: `npm install`
  - Start Command: `npm run start-api`
  - Add Environment Variables:
    - `STRIPE_SECRET_KEY`: Your Stripe key
    - `NODE_ENV`: production

3. **Update Upload Page**:
- Change API URL in `add-pottery-mobile.html`:
```javascript
// Change this line:
const response = await fetch('/api/add-pottery', {
// To:
const response = await fetch('https://mccluskey-pottery-api.onrender.com/api/add-pottery', {
```

## Option 2: Deploy to Vercel (Also FREE)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard

## Option 3: Traditional Hosting (If you have a server)

1. **On your server**:
```bash
# Install Node.js and PM2
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone your project
git clone [your-repo]
cd mccluskey-pottery-website

# Install dependencies
npm install

# Start with PM2
pm2 start api/simple-product-api.js --name pottery-api
pm2 save
pm2 startup
```

## 📱 Mobile App Option

Want a real app on your aunt's phone? Create a PWA:

1. Add to `add-pottery-mobile.html`:
```html
<link rel="manifest" href="manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
```

2. Create `manifest.json`:
```json
{
  "name": "McCluskey Pottery Upload",
  "short_name": "Pottery Upload",
  "start_url": "/add-pottery-mobile.html",
  "display": "standalone",
  "background_color": "#fff",
  "theme_color": "#4A6FA5",
  "icons": [
    {
      "src": "images/logo.svg",
      "sizes": "192x192"
    }
  ]
}
```

3. Your aunt can "Add to Home Screen" on her phone!

## 🔒 Security Tips

1. **Use environment variables** for all secrets
2. **Add rate limiting** to prevent spam:
```javascript
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests
});
app.use('/api/', limiter);
```

3. **Add basic auth** for the upload page:
```javascript
app.use('/add-pottery-mobile.html', (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth === 'Basic ' + Buffer.from('aunt:pottery123').toString('base64')) {
    next();
  } else {
    res.status(401).send('Authentication required');
  }
});
```

## 📊 Monitoring

Add simple analytics to track uploads:
```javascript
// In your API endpoint
console.log(`New pottery added: ${name} at ${new Date()}`);

// Or use a service like LogRocket or Sentry for production
```

## 🚀 Done!
Your aunt can now upload pottery from anywhere in the world!