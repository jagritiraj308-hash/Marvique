/* =========================
   FEATURED COLLECTION
   Category filters, search and product cards.
========================= */

import {
    getProducts,
    onProductsChange,
    initProducts
} from "./products.js";

import { cloudinaryImageUrl } from "./cloudinary.js";
import { openBuyModal } from "./buy.js";
import { showToast } from "./toast.js";

import {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    updateWishlistCount,
    onWishlistChange
} from "./wishlist-store.js";

fetch("sections/featured.html?v=20261106")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load featured.html");
        }
        return response.text();
    })
    .then(function (data) {
        const host = document.getElementById("featured-container");

        if (!host) return;

        host.innerHTML = data;

        const grid = host.querySelector("#featuredGrid");
        const filterGroup = host.querySelector("#collectionFilters");
        const searchInput = host.querySelector("#productSearch");
        const countElement = host.querySelector("#collectionCount");
        const emptyElement = host.querySelector("#collectionEmpty");

        if (!grid || !filterGroup) return;

        let allProducts = [];
        let activeFilter = "all";
        let searchTerm = "";

        function normalize(value) {
            return String(value == null ? "" : value).trim().toLowerCase();
        }

        function categoryOf(product) {
            const label = String(product.category || "Other").trim();
            return label || "Other";
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

        function buildFilters() {
            const categories = new Map();

            allProducts.forEach(function (product) {
                const label = categoryOf(product);
                const key = normalize(label);

                if (!categories.has(key)) {
                    categories.set(key, label);
                }
            });

            if (activeFilter !== "all" && !categories.has(activeFilter)) {
                activeFilter = "all";
            }

            filterGroup.replaceChildren();

            const chips = [["all", "All"]];

            Array.from(categories.keys())
                .sort(function (a, b) {
                    return categories.get(a).localeCompare(categories.get(b));
                })
                .forEach(function (key) {
                    chips.push([key, categories.get(key)]);
                });

            chips.forEach(function (chip) {
                const button = document.createElement("button");
                const isActive = chip[0] === activeFilter;

                button.type = "button";
                button.className = "filter-chip" + (isActive ? " is-active" : "");
                button.dataset.filter = chip[0];
                button.textContent = chip[1];
                button.setAttribute("aria-pressed", isActive ? "true" : "false");

                filterGroup.appendChild(button);
            });
        }

        function matches(product) {
            if (
                activeFilter !== "all" &&
                normalize(product.category) !== activeFilter
            ) {
                return false;
            }

            if (!searchTerm) return true;

            return [
                product.name,
                product.description,
                product.category,
                product.finish,
                product.size
            ].some(function (value) {
                return normalize(value).includes(searchTerm);
            });
        }

        function paintWishlistButton(button, product) {
            const saved = isInWishlist(product.id);

            button.textContent = saved ? "❤️ Saved" : "❤️ Wishlist";
            button.setAttribute("aria-pressed", saved ? "true" : "false");
            button.title = saved
                ? "Remove from wishlist"
                : "Add to wishlist";
        }

        function createCard(product) {
            const card = document.createElement("article");
            card.className = "product-card";

            const image = document.createElement("div");
            image.className =
                "product-image " +
                normalize(product.category || "marble").replace(/\s+/g, "-") +
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
            title.textContent = product.name || "Untitled product";

            const meta = document.createElement("p");
            meta.className = "product-meta";

            const metaParts = [product.finish, product.size].filter(Boolean);

            if (metaParts.length) {
                meta.textContent = metaParts.join(" · ");
            }

            const description = document.createElement("p");
            description.textContent = product.description || "";

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

            const wishlistButton = document.createElement("button");
            wishlistButton.type = "button";
            wishlistButton.className = "wishlist-btn";
            wishlistButton.dataset.id = product.id;

            paintWishlistButton(wishlistButton, product);

            wishlistButton.addEventListener("click", function () {
                if (isInWishlist(product.id)) {
                    removeFromWishlist(product.id);
                    showToast(product.name + " removed from wishlist.");
                    return;
                }

                addToWishlist(product);
                showToast(product.name + " added to wishlist ❤️");
            });

            actions.appendChild(wishlistButton);

            content.append(title);

            if (meta.textContent) {
                content.appendChild(meta);
            }

            if (description.textContent) {
                content.appendChild(description);
            }

            content.append(price, actions);

            card.append(image, content);

            return card;
        }

        function render() {
            const visible = allProducts.filter(matches);

            grid.replaceChildren();

            visible.forEach(function (product) {
                grid.appendChild(createCard(product));
            });

            const total = allProducts.length;
            const shown = visible.length;

            if (!total) {
                countElement.textContent = "No products available yet.";
            } else if (
                shown === total &&
                activeFilter === "all" &&
                !searchTerm
            ) {
                countElement.textContent =
                    total + (total === 1 ? " product" : " products");
            } else {
                countElement.textContent =
                    "Showing " + shown + " of " + total + " products";
            }

            if (emptyElement) {
                emptyElement.hidden = shown !== 0 || total === 0;
            }

            grid.style.display = shown === 0 ? "none" : "";
        }

        filterGroup.addEventListener("click", function (event) {
            const chip = event.target.closest(".filter-chip");

            if (!chip) return;

            activeFilter = chip.dataset.filter || "all";

            filterGroup.querySelectorAll(".filter-chip").forEach(function (item) {
                const isActive = item === chip;

                item.classList.toggle("is-active", isActive);
                item.setAttribute("aria-pressed", isActive ? "true" : "false");
            });

            render();
        });

        if (searchInput) {
            searchInput.addEventListener("input", function () {
                searchTerm = normalize(searchInput.value);
                render();
            });
        }

        onWishlistChange(function () {
            grid.querySelectorAll(".wishlist-btn").forEach(function (button) {
                const product = allProducts.find(function (item) {
                    return String(item.id) === button.dataset.id;
                });

                if (product) {
                    paintWishlistButton(button, product);
                }
            });
        });

        onProductsChange(function (products) {
            allProducts = products || getProducts();
            buildFilters();
            render();
        });

        updateWishlistCount();
        initProducts();
    })
    .catch(function (error) {
        console.error("Featured section loading error:", error);
    });
