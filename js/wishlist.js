/* =========================
   WISHLIST
========================= */

import {
    getProducts,
    initProducts,
    onProductsChange
} from "./products.js";

import { cloudinaryImageUrl } from "./cloudinary.js";
import { openBuyModal } from "./buy.js";
import { showToast } from "./toast.js";

import {
    readWishlist,
    removeFromWishlist,
    clearWishlist,
    updateWishlistCount,
    onWishlistChange
} from "./wishlist-store.js";

fetch("sections/wishlist.html?v=20261106")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load wishlist.html");
        }
        return response.text();
    })
    .then(function (data) {
        const host = document.getElementById("wishlist-container");

        if (!host) return;

        host.innerHTML = data;

        const grid = host.querySelector("#wishlistGrid");
        const emptyState = host.querySelector("#wishlistEmpty");
        const clearButton = host.querySelector("#clearWishlist");

        if (!grid) return;

        let products = getProducts();

        function findProduct(productId) {
            return products.find(function (product) {
                return String(product.id) === String(productId);
            });
        }

        function formatPrice(value) {
            const price = Number(value);

            if (!Number.isFinite(price) || price <= 0) {
                return "Price on Request";
            }

            return "₹" + price.toLocaleString("en-IN") + " / sq.ft";
        }

        function hasPrice(product) {
            const price = Number(product.price);
            return Number.isFinite(price) && price > 0;
        }

        function createCard(product) {
            const card = document.createElement("article");
            card.className = "product-card";

            const image = document.createElement("div");
            image.className =
                "product-image " +
                String(product.category || "marble")
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "-") +
                "-image";

            if (product.image) {
                image.style.backgroundImage =
                    'url("' +
                    cloudinaryImageUrl(product.image, 900).replace(/"/g, "%22") +
                    '")';
            }

            const category = document.createElement("span");
            category.textContent = product.category || "";
            image.appendChild(category);

            const content = document.createElement("div");
            content.className = "product-content";

            const title = document.createElement("h3");
            title.textContent = product.name || "Saved product";

            const metaParts = [product.finish, product.size].filter(Boolean);

            const price = document.createElement("p");
            price.className = "product-price";
            price.textContent = formatPrice(product.price);

            const actions = document.createElement("div");
            actions.className = "product-actions";

            if (hasPrice(product)) {
                const buyButton = document.createElement("button");
                buyButton.type = "button";
                buyButton.className = "buy-btn";
                buyButton.textContent = "Buy Now";
                buyButton.addEventListener("click", function () {
                    openBuyModal(product);
                });
                actions.appendChild(buyButton);
            }

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-wishlist";
            removeButton.textContent = "Remove";
            removeButton.addEventListener("click", function () {
                removeFromWishlist(product.id);
                showToast(product.name + " removed from wishlist.");
            });

            actions.appendChild(removeButton);

            content.appendChild(title);

            if (metaParts.length) {
                const meta = document.createElement("p");
                meta.className = "product-meta";
                meta.textContent = metaParts.join(" · ");
                content.appendChild(meta);
            }

            content.append(price, actions);
            card.append(image, content);

            return card;
        }

        function render() {
            const items = readWishlist();

            grid.replaceChildren();

            if (emptyState) {
                emptyState.hidden = items.length > 0;
            }

            if (clearButton) {
                clearButton.hidden = items.length === 0;
            }

            items.forEach(function (saved) {
                const liveProduct = findProduct(saved.id);

                grid.appendChild(
                    createCard(Object.assign({}, saved, liveProduct || {}))
                );
            });

            updateWishlistCount();
        }

        if (clearButton) {
            clearButton.addEventListener("click", function () {
                if (!readWishlist().length) return;

                clearWishlist();
                showToast("Wishlist cleared.");
            });
        }

        onWishlistChange(render);

        onProductsChange(function (items) {
            products = items || getProducts();
            render();
        });

        initProducts();
    })
    .catch(function (error) {
        console.error("Wishlist loading error:", error);
    });
