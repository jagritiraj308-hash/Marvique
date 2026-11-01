
/* =========================
   FEATURED COLLECTION
========================= */

fetch("sections/featured.html")
    .then(response => response.text())
    .then(data => {
        const featuredContainer =
            document.getElementById("featured");

        featuredContainer.innerHTML = data;

        let wishlist = JSON.parse(
            localStorage.getItem("marviqueWishlist") || "[]"
        );

        function updateWishlistCount() {
            const countElement =
                document.getElementById("wishlistCount");

            if (countElement) {
                countElement.textContent = wishlist.length;
            }
        }

        function renderProducts() {
            const products = getProducts();
            console.log("Collections products:", products);

            const grid =
                featuredContainer.querySelector(".featured-grid");

            if (!grid) return;

            grid.innerHTML = "";

            products.forEach(function (product) {
                const card = document.createElement("article");
                card.className = "product-card";

                const image = document.createElement("div");
                image.className =
                    "product-image " +
                    product.category.toLowerCase() + "-image";
                if (product.image) {
                    image.style.backgroundImage = `url("${product.image}")`;
                }

                const category = document.createElement("span");
                category.textContent = product.category;
                image.appendChild(category);

                const content = document.createElement("div");
                content.className = "product-content";

                const title = document.createElement("h3");
                title.textContent = product.name;

                const description = document.createElement("p");
                description.textContent = product.description;

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

                function updateButton() {
                    const saved = wishlist.some(
                        item => item.id === product.id
                    );

                    button.textContent = saved
                        ? "❤️ Added to Wishlist"
                        : "❤️ Wishlist";
                }

                updateButton();

                button.addEventListener("click", function () {
                    const alreadyAdded = wishlist.some(
                        item => item.id === product.id
                    );

                    if (alreadyAdded) {
                        alert("This product is already in your Wishlist!");
                        return;
                    }

                    wishlist.push({
                        id: product.id,
                        name: product.name,
                        price: Number(product.price)
                    });

                    localStorage.setItem(
                        "marviqueWishlist",
                        JSON.stringify(wishlist)
                    );

                    updateWishlistCount();
                    updateButton();

                    alert(product.name + " added to Wishlist ❤️");
                });

                actions.appendChild(button);
                content.append(
                    title,
                    description,
                    price,
                    actions
                );

                card.append(image, content);
                grid.appendChild(card);

                card.addEventListener("mouseenter", function () {
                    card.style.transform = "translateY(-8px)";
                });

                card.addEventListener("mouseleave", function () {
                    card.style.transform = "translateY(0)";
                });
            });
        }

        updateWishlistCount();
        renderProducts();
    })
    .catch(error => {
        console.error(
            "Featured section loading error:",
            error
        );
    });
