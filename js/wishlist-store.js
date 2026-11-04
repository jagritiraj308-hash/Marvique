/* =========================
   WISHLIST STORE
   Shared localStorage helpers + change notifications.
========================= */

const WISHLIST_KEY = "marviqueWishlist";
const CHANGE_EVENT = "marvique:wishlistchange";

function normalizeItem(item) {
    if (!item || typeof item !== "object" || !item.id) return null;

    return {
        id: String(item.id),
        name: item.name || "",
        price: item.price == null || item.price === "" ? null : Number(item.price),
        image: item.image || "",
        category: item.category || "",
        finish: item.finish || "",
        size: item.size || ""
    };
}

export function readWishlist() {
    try {
        const saved = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");

        if (!Array.isArray(saved)) return [];

        return saved.map(normalizeItem).filter(Boolean);
    } catch (error) {
        return [];
    }
}

function writeWishlist(items) {
    try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
    } catch (error) {
        console.warn("Wishlist could not be saved:", error);
    }

    updateWishlistCount();
    window.dispatchEvent(
        new CustomEvent(CHANGE_EVENT, { detail: items })
    );

    return items;
}

export function isInWishlist(productId) {
    return readWishlist().some(function (item) {
        return item.id === String(productId);
    });
}

export function addToWishlist(product) {
    const item = normalizeItem(product);

    if (!item) return false;

    const items = readWishlist();

    if (items.some(function (saved) { return saved.id === item.id; })) {
        return false;
    }

    writeWishlist(items.concat(item));

    return true;
}

export function removeFromWishlist(productId) {
    const id = String(productId);

    writeWishlist(
        readWishlist().filter(function (item) {
            return item.id !== id;
        })
    );
}

export function clearWishlist() {
    writeWishlist([]);
}

export function updateWishlistCount() {
    const countElement = document.getElementById("wishlistCount");

    if (countElement) {
        countElement.textContent = readWishlist().length;
    }
}

/**
 * Runs the callback when the wishlist changes in this tab or another tab.
 * Returns an unsubscribe function.
 */
export function onWishlistChange(callback) {
    function handleStorage(event) {
        if (event.key === WISHLIST_KEY) {
            callback(readWishlist());
        }
    }

    function handleCustom(event) {
        callback(event.detail || readWishlist());
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CHANGE_EVENT, handleCustom);

    return function () {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(CHANGE_EVENT, handleCustom);
    };
}
