// McCluskey Pottery - Real Products with Actual Images
const mccluskeyProducts = [
    {
        id: 1,
        name: "Porcelain Irish Swallow",
        story: "The beloved swallow returns each spring to Ireland, bringing hope and renewal. This traditional scene captures their graceful flight in fine porcelain.",
        price: 48.00,
        category: "irish",
        image: "images/swallow-main.svg",
        images: [
            "images/swallow-main.svg",
            "images/swallow-alt.svg"
        ],
        featured: true,
        details: "7.5 inches x 1.25 inches (19 x 3 cm), presented on blue or beige mount with white frame",
        stock: 5
    },
    {
        id: 2,
        name: "Framed Porcelain Irish Cottage - Blue Door",
        story: "A charming traditional Irish cottage with its distinctive blue door. This scene could be found anywhere across Ireland's beautiful countryside.",
        price: 48.00,
        category: "irish",
        image: "images/cottage-blue-main.svg",
        images: [
            "images/cottage-blue-main.svg",
            "images/cottage-blue-alt.svg"
        ],
        details: "6.5 inches (16 cm), mounted on quality frame",
        stock: 3
    },
    {
        id: 3,
        name: "Framed Porcelain Irish Cottage Scene",
        story: "Traditional Irish cottage nestled in the countryside, capturing the warmth and character of rural Irish life in exquisite porcelain detail.",
        price: 48.00,
        category: "irish",
        image: "images/cottage-scene.svg",
        details: "6.5 inches (16 cm), beautifully framed",
        stock: 4
    },
    {
        id: 4,
        name: "Framed Porcelain Mountain Scene",
        story: "Ireland's majestic mountains captured in delicate porcelain, with a traditional cottage in the foreground surrounded by emerald green fields.",
        price: 48.00,
        category: "irish",
        image: "images/mountain-scene-main.svg",
        images: [
            "images/mountain-scene-main.svg",
            "images/mountain-scene-alt.svg"
        ],
        featured: true,
        details: "6.5 inches (16 cm), presented in elegant frame",
        stock: 6
    },
    {
        id: 5,
        name: "Fáilte Magnet - Green",
        story: "A warm Irish welcome for your home. 'Fáilte' means welcome in Irish - perfect for your fridge or any magnetic surface.",
        price: 9.95,
        category: "irish",
        image: "images/failte-green.svg",
        details: "1 inch (2.5 cm) porcelain magnet",
        stock: 12
    },
    {
        id: 6,
        name: "Fáilte Magnet - Blue",
        story: "Traditional Irish welcome in beautiful blue. A small piece of Ireland to brighten your day.",
        price: 9.95,
        category: "irish",
        image: "images/failte-blue.svg",
        details: "1 inch (2.5 cm) porcelain magnet",
        stock: 10
    }
];

// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = mccluskeyProducts;
}