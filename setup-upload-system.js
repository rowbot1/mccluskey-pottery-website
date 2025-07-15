#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎨 Setting up McCluskey Pottery Upload System...\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file from example...');
    fs.copyFileSync('.env.example', '.env');
    console.log('⚠️  Please edit .env and add your Stripe keys!\n');
}

// Create necessary directories
const dirs = [
    'images/products',
    'data',
    'api'
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }
});

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
    console.log('\n📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
}

// Create initial products.json if it doesn't exist
const productsFile = path.join('data', 'products.json');
if (!fs.existsSync(productsFile)) {
    fs.writeFileSync(productsFile, '[]');
    console.log('✅ Created empty products.json');
}

console.log('\n✨ Setup complete!');
console.log('\n📱 Next steps:');
console.log('1. Edit .env and add your Stripe keys');
console.log('2. Run: npm run start-api');
console.log('3. Open: http://localhost:3000/add-pottery-mobile.html');
console.log('\nYour aunt can then start uploading pottery! 🏺');