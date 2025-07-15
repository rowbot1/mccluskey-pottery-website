# 🌐 GitHub Pages Setup for McCluskey Pottery

## Important Note
GitHub Pages only hosts static files (HTML, CSS, JS). The upload system requires a backend API, so we need a hybrid approach:

1. **GitHub Pages**: Hosts the main pottery website
2. **Separate API**: Hosts the upload functionality (Render/Vercel/etc.)

## Step 1: Enable GitHub Pages

1. Go to your repository: https://github.com/rowbot1/mccluskey-pottery-website
2. Click **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Choose **main** branch and **/ (root)** folder
5. Click **Save**

Your site will be available at: https://rowbot1.github.io/mccluskey-pottery-website/

## Step 2: Deploy the API Separately

Since GitHub Pages can't run Node.js, deploy the API to Render (FREE):

1. Go to [render.com](https://render.com)
2. Sign up/login with GitHub
3. Click **New +** → **Web Service**
4. Connect your repo
5. Settings:
   - **Name**: mccluskey-pottery-api
   - **Root Directory**: /
   - **Build Command**: npm install
   - **Start Command**: npm run start-api
   - **Environment Variables**:
     - STRIPE_SECRET_KEY: [your key]

## Step 3: Update Upload Page for Production

Create a production version of the upload page:

```javascript
// In add-pottery-mobile.html, change:
const response = await fetch('/api/add-pottery', {

// To:
const API_URL = 'https://mccluskey-pottery-api.onrender.com';
const response = await fetch(`${API_URL}/api/add-pottery`, {
```

## Step 4: Create a Static Admin Page

Create `admin.html` for GitHub Pages:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - McCluskey Pottery</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .admin-card {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .admin-link {
            display: inline-block;
            background: #4A6FA5;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
        }
        .admin-link:hover {
            background: #3a5f95;
        }
        .status {
            padding: 10px;
            background: #f0f0f0;
            border-radius: 5px;
            margin: 10px 0;
        }
        .online { background: #d4edda; color: #155724; }
        .offline { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="admin-card">
        <h1>McCluskey Pottery Admin</h1>
        
        <h2>📱 Add New Pottery</h2>
        <p>Use this link on your phone to add new pieces:</p>
        <a href="https://mccluskey-pottery-api.onrender.com/add-pottery-mobile.html" 
           class="admin-link">
            Open Upload Page
        </a>
        
        <h2>🔌 API Status</h2>
        <div id="api-status" class="status">Checking...</div>
        
        <h2>📊 Quick Stats</h2>
        <div id="stats">Loading...</div>
    </div>

    <script>
        // Check API status
        const API_URL = 'https://mccluskey-pottery-api.onrender.com';
        
        async function checkStatus() {
            try {
                const response = await fetch(`${API_URL}/api/products`);
                if (response.ok) {
                    document.getElementById('api-status').className = 'status online';
                    document.getElementById('api-status').textContent = '✅ API is online';
                    
                    const products = await response.json();
                    document.getElementById('stats').innerHTML = `
                        <p>Total Products: ${products.length}</p>
                        <p>In Stock: ${products.filter(p => p.inStock).length}</p>
                        <p>Sold: ${products.filter(p => !p.inStock).length}</p>
                    `;
                } else {
                    throw new Error('API offline');
                }
            } catch (error) {
                document.getElementById('api-status').className = 'status offline';
                document.getElementById('api-status').textContent = '❌ API is offline';
            }
        }
        
        checkStatus();
        setInterval(checkStatus, 30000); // Check every 30 seconds
    </script>
</body>
</html>
```

## Step 5: Update Navigation

Add admin link to your main site:

```javascript
// In footer or hidden menu
<a href="/admin.html" style="opacity: 0.5;">Admin</a>
```

## Complete Setup URLs:

- **Main Site**: https://rowbot1.github.io/mccluskey-pottery-website/
- **Admin Page**: https://rowbot1.github.io/mccluskey-pottery-website/admin.html
- **Upload API**: https://mccluskey-pottery-api.onrender.com/

## For Your Aunt:

1. Bookmark the admin page on her phone
2. Click "Open Upload Page" to add pottery
3. Everything else happens automatically!

## Note on Free Hosting:

- Render free tier may sleep after 15 min of inactivity
- First request might take 30 seconds to wake up
- Consider upgrading to paid tier ($7/month) for always-on service