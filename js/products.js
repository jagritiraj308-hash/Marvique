/* =========================
   PRODUCTS STORE
   Firebase Realtime Database with localStorage fallback.
========================= */

import { db } from "../firebase-config.js";
import {
    ref,
    get,
    set,
    onValue
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const STORAGE_KEY = "marviqueProducts";
const DB_PATH = "products";

export const defaultProducts = [
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

let cachedProducts = null;
let storageMode = "local";
let initPromise = null;

const listeners = new Set();

/* ---------- helpers ---------- */

function notifyListeners() {
    listeners.forEach(function (listener) {
        try {
            listener(getProducts(), storageMode);
        } catch (error) {
            console.error("Products listener failed:", error);
        }
    });
}

function normalizeProducts(value) {
    if (!value) return [];

    const items = Array.isArray(value) ? value : Object.values(value);

    return items
        .filter(function (item) {
            return item && typeof item === "object" && item.id;
        })
        .map(function (item) {
            return Object.assign({}, item, {
                price: item.price == null || item.price === "" ? null : Number(item.price)
            });
        });
}

function keyedById(products) {
    return products.reduce(function (result, product) {
        result[product.id] = product;
        return result;
    }, {});
}

function readLocalProducts() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved !== null) {
        try {
            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed) && parsed.length > 0) {
                const defaultIds = new Set(
                    defaultProducts.map(function (product) { return product.id; })
                );

                const savedDefaults = parsed.filter(function (product) {
                    return defaultIds.has(product.id);
                });

                const otherProducts = parsed.filter(function (product) {
                    return !defaultIds.has(product.id);
                });

                const mergedDefaults = defaultProducts.map(function (product) {
                    const savedProduct = savedDefaults.find(function (item) {
                        return item.id === product.id;
                    });

                    return savedProduct
                        ? Object.assign({}, product, savedProduct)
                        : product;
                });

                return mergedDefaults.concat(otherProducts);
            }
        } catch (error) {
            console.error("Saved products could not be read:", error);
        }
    }

    return defaultProducts.slice();
}

function writeLocalProducts(products) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
        console.warn("Products could not be cached locally:", error);
    }
}

function setCache(products) {
    cachedProducts = products;
    writeLocalProducts(products);
    notifyListeners();
}

/* ---------- public API ---------- */

export function getProducts() {
    if (!cachedProducts) {
        cachedProducts = readLocalProducts();
    }

    return cachedProducts;
}

export function getStorageMode() {
    return storageMode;
}

export function isCloudEnabled() {
    return storageMode === "cloud";
}

/**
 * Subscribes to product changes. The callback runs immediately and again
 * whenever products change locally or in the Realtime Database.
 * Returns an unsubscribe function.
 */
export function onProductsChange(listener) {
    listeners.add(listener);
    listener(getProducts(), storageMode);

    return function () {
        listeners.delete(listener);
    };
}

/**
 * Connects to the Realtime Database. Falls back to localStorage when the
 * database is unreachable (not created yet, rules block reads, offline).
 */
export function initProducts() {
    if (initPromise) return initPromise;

    getProducts();

    initPromise = new Promise(function (resolve) {
        let resolved = false;

        function finish() {
            if (resolved) return;
            resolved = true;
            resolve(getProducts());
        }

        try {
            const productsRef = ref(db, DB_PATH);

            onValue(
                productsRef,
                function (snapshot) {
                    const remoteProducts = normalizeProducts(snapshot.val());

                    storageMode = "cloud";

                    if (remoteProducts.length > 0) {
                        cachedProducts = remoteProducts;
                        writeLocalProducts(remoteProducts);
                    }

                    notifyListeners();
                    finish();
                },
                function (error) {
                    console.warn(
                        "Realtime Database unavailable. Using localStorage instead.",
                        error
                    );

                    storageMode = "local";
                    notifyListeners();
                    finish();
                }
            );
        } catch (error) {
            console.warn(
                "Realtime Database could not be initialised. Using localStorage instead.",
                error
            );

            storageMode = "local";
            finish();
        }
    });

    return initPromise;
}

/**
 * Copies the current products into an empty database.
 * Called after admin login so first-time setup is automatic.
 */
export async function seedProductsIfEmpty() {
    if (storageMode !== "cloud") {
        return { seeded: false, reason: "local-only" };
    }

    const snapshot = await get(ref(db, DB_PATH));
    const remoteProducts = normalizeProducts(snapshot.val());

    if (remoteProducts.length > 0) {
        return { seeded: false, reason: "already-populated" };
    }

    await set(ref(db, DB_PATH), keyedById(getProducts()));

    return { seeded: true };
}

/**
 * Adds (or replaces) a product. Always writes to localStorage, and writes to
 * the Realtime Database when it is available.
 */
export async function addProduct(product) {
    const products = getProducts();
    const exists = products.some(function (item) {
        return item.id === product.id;
    });

    const nextProducts = exists
        ? products.map(function (item) {
            return item.id === product.id ? product : item;
        })
        : products.concat(product);

    setCache(nextProducts);

    if (storageMode !== "cloud") {
        return { savedToCloud: false };
    }

    try {
        await seedProductsIfEmpty();
        await set(ref(db, DB_PATH + "/" + product.id), product);
        return { savedToCloud: true };
    } catch (error) {
        console.error("Product could not be saved to Firebase:", error);
        return { savedToCloud: false, error: error };
    }
}

/**
 * Removes a product from localStorage and the Realtime Database.
 */
export async function deleteProduct(productId) {
    const nextProducts = getProducts().filter(function (item) {
        return item.id !== productId;
    });

    setCache(nextProducts);

    if (storageMode !== "cloud") {
        return { deletedFromCloud: false };
    }

    try {
        await set(ref(db, DB_PATH + "/" + productId), null);
        return { deletedFromCloud: true };
    } catch (error) {
        console.error("Product could not be deleted from Firebase:", error);
        return { deletedFromCloud: false, error: error };
    }
}

/**
 * Kept for backwards compatibility with older code.
 */
export function saveProducts(products) {
    setCache(products);
}
