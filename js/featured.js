/* =========================
   FEATURED COLLECTION
========================= */

import {
    getProducts,
    onProductsChange,
    initProducts
} from "./products.js";

import { cloudinaryImageUrl } from "./cloudinary.js";

fetch("sections/featured.html")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load featured.html");
        }
        return response.text();
    })
    .then(function (data) {
        const featuredContainer = document.getElementById("featured");

        if (!featuredContainer) return;

        featuredContainer.innerHTML = data;

        const grid = featuredContainer.querySelector(".featured-grid");

        if (!grid) return;

        function readWishlist() {
            try {
                const saved = JSON.parse(
                    localStorage.getItem("marviqueWishlist") || "[]"
                );
                return Array.isArray(saved) ? saved : [];
            } catch (error) {
                return [];
            }
        }

        function updateWishlistCount() {
            const countElement = document.getElementById("wishlistCount");

            if (countElement) {
                countElement.textContent = readWishlist().length;
            }
        }

        function renderProducts(products) {
            const wishlist = readWishlist();

            grid.innerHTML = "";

            (products || getProducts()).forEach(function (product) {
                const card = document.createElement("article");
                card.className = "product-card";

                const image = document.createElement("div");
                image.className =
                    "product-image " +
                    String(product.category || "marble").toLowerCase() +
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
                title.textContent = product.name;

                const description = document.createElement("p");
                description.textContent = product.description || "";

                const price = document.createElement("p");
                price.className = "product-price";

                price.textContent =
                    product.price != null && product.price !== ""
                        ? "₹" + Number(product.price).toLocaleString("en-IN") + " / sq.ft"
                        : "Price on Request";

                const actions = document.createElement("div");
                actions.className = "product-actions";

                const button = document.createElement("button");
                button.className = "wishlist-btn";
                button.dataset.id = product.id;
                button.dataset.name = product.name;
                button.dataset.price = product.price;

                function isSaved() {
                    return readWishlist().some(function (item) {
                        return item.id === product.id;
                    });
                }

                function updateButton() {
                    button.textContent = isSaved()
                        ? "❤️ Added to Wishlist"
                        : "❤️ Wishlist";
                }

                updateButton();

                button.addEventListener("click", function () {
                    const currentWishlist = readWishlist();

                    if (isSaved()) {
                        alert("This product is already in your Wishlist!");
                        return;
                    }

                    currentWishlist.push({
                        id: product.id,
                        name: product.name,
                        price: product.price == null ? null : Number(product.price),
                        image: product.image || ""
                    });

                    localStorage.setItem(
                        "marviqueWishlist",
                        JSON.stringify(currentWishlist)
                    );

                    updateWishlistCount();
                    updateButton();

                    alert(product.name + " added to Wishlist ❤️");
                });

                actions.appendChild(button);
                content.append(title, description, price, actions);

                card.append(image, content);
                grid.appendChild(card);
            });
        }

        onProductsChange(renderProducts);
        updateWishlistCount();
        initProducts();
    })
    .catch(function (error) {
        console.error("Featured section loading error:", error);
    });
