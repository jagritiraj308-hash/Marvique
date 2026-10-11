
const defaultProducts = [
    {
        id: "marble-01",
        name: "Luxury Marble",
        description: "Elegant natural marble with unique patterns and timeless character.",
        price: 2500,
        category: "MARBLE"
    },
    {
        id: "porcelain-01",
        name: "Porcelain Tiles",
        description: "Durable and sophisticated porcelain surfaces for modern interiors.",
        price: 1800,
        category: "PORCELAIN"
    },
    {
        id: "ceramic-01",
        name: "Ceramic Tiles",
        description: "Versatile ceramic designs created for beautiful everyday living.",
        price: 1200,
        category: "CERAMIC"
    }
];

// Load saved products or use default products
function getProducts() {
    const savedProducts = localStorage.getItem("marviqueProducts");

    if (savedProducts !== null) {
        return JSON.parse(savedProducts);
    }

    localStorage.setItem(
        "marviqueProducts",
        JSON.stringify(defaultProducts)
    );

    return defaultProducts;
}

// Save products
function saveProducts(products) {
    localStorage.setItem(
        "marviqueProducts",
        JSON.stringify(products)
    );
}
