
const defaultProducts = [
    {
        id: "k6201",
        name: "K 6201",
        description: "Vitrified polished floor tiles",
        category: "VITRIFIED",
        finish: "Polished",
        size: "600 x 600 mm",
        quantity: 288,
        boxes: 200,
        price: null,
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600"
    },
    {
        id: "k6204",
        name: "K 6204",
        description: "Vitrified polished floor tiles",
        category: "VITRIFIED",
        finish: "Polished",
        size: "600 x 600 mm",
        quantity: 288,
        boxes: 200,
        price: null,
        image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600"
    },
    {
        id: "k6211",
        name: "K 6211",
        description: "Vitrified polished floor tiles",
        category: "VITRIFIED",
        finish: "Polished",
        size: "600 x 600 mm",
        quantity: 216,
        boxes: 150,
        price: null,
        image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600"
    },
    {
        id: "k6223",
        name: "K 6223",
        description: "Vitrified polished floor tiles",
        category: "VITRIFIED",
        finish: "Polished",
        size: "600 x 600 mm",
        quantity: 144,
        boxes: 100,
        price: null,
        image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600"
    },
    {
        id: "k6302",
        name: "K 6302",
        description: "Vitrified polished floor tiles",
        category: "VITRIFIED",
        finish: "Polished",
        size: "600 x 600 mm",
        quantity: 288,
        boxes: 200,
        price: null,
        image: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=600"
    },
    {
        id: "k6701",
        name: "K 6701 POLISH",
        description: "Vitrified polished floor tiles",
        category: "VITRIFIED",
        finish: "Polished",
        size: "600 x 600 mm",
        quantity: 216,
        boxes: 150,
        price: null,
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600"
    },
    {
        id: "k6705",
        name: "K 6705 POLISH",
        description: "Vitrified polished floor tiles",
        category: "VITRIFIED",
        finish: "Polished",
        size: "600 x 600 mm",
        quantity: 216,
        boxes: 150,
        price: null,
        image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600"
    },
    {
        id: "k6708",
        name: "K 6708 POLISH",
        description: "Vitrified polished floor tiles",
        category: "VITRIFIED",
        finish: "Polished",
        size: "600 x 600 mm",
        quantity: 144,
        boxes: 100,
        price: null,
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600"
    },
    {
        id: "k6702",
        name: "K 6702 MATT",
        description: "Vitrified matt-finish floor tiles",
        category: "VITRIFIED",
        finish: "Matt",
        size: "600 x 600 mm",
        quantity: 72,
        boxes: 50,
        price: null,
        image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600"
    },
    {
        id: "k6209",
        name: "K 6209",
        description: "Vitrified polished floor tiles",
        category: "VITRIFIED",
        finish: "Polished",
        size: "600 x 600 mm",
        quantity: 144,
        boxes: 100,
        price: null,
        image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600"
    }
];



function getProducts() {
    const savedProducts = localStorage.getItem("marviqueProducts");

    if (savedProducts !== null) {
        try {
            const parsedProducts = JSON.parse(savedProducts);

            if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
                const defaultIds = new Set(
                    defaultProducts.map(product => product.id)
                );

                const savedDefaults = parsedProducts.filter(
                    product => defaultIds.has(product.id)
                );

                const otherProducts = parsedProducts.filter(
                    product => !defaultIds.has(product.id)
                );

                const mergedDefaults = defaultProducts.map(product => {
                    const saved = savedDefaults.find(
                        item => item.id === product.id
                    );

                    return saved ? { ...product, ...saved } : product;
                });

                const mergedProducts = [...mergedDefaults, ...otherProducts];

                localStorage.setItem(
                    "marviqueProducts",
                    JSON.stringify(mergedProducts)
                );

                return mergedProducts;
            }
        } catch (error) {
            console.error("Saved products could not be read:", error);
        }
    }

    localStorage.setItem(
        "marviqueProducts",
        JSON.stringify(defaultProducts)
    );

    return defaultProducts;
}

function saveProducts(products) {
    localStorage.setItem("marviqueProducts", JSON.stringify(products));
}


function saveProducts(products) {
    localStorage.setItem(
        "marviqueProducts",
        JSON.stringify(products)
    );
}

