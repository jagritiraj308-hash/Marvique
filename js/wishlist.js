 /* =========================
   WISHLIST
========================= */

fetch("sections/wishlist.html")
    .then(response => {
        if (!response.ok) {
            throw new Error("Could not load wishlist.html");
        }
        return response.text();
    })
    .then(data => {

        const wishlistSection = document.getElementById("wishlist");
        wishlistSection.innerHTML = data;

        let wishlist = JSON.parse(
            localStorage.getItem("marviqueWishlist") || "[]"
        );

        const container = document.getElementById("wishlistItems");
        const clearButton = document.getElementById("clearWishlist");

        function saveWishlist() {
            localStorage.setItem(
                "marviqueWishlist",
                JSON.stringify(wishlist)
            );
        }

        function updateWishlistCount() {
            const countElement = document.getElementById("wishlistCount");

            if (countElement) {
                countElement.textContent = wishlist.length;
            }
        }

        function displayWishlist() {
            container.innerHTML = "";

            if (wishlist.length === 0) {
                container.textContent = "Your wishlist is empty ❤️";
                return;
            }

            wishlist.forEach(product => {
                const card = document.createElement("div");
                card.className = "saved-product-card";

                const name = document.createElement("h3");
                name.textContent = product.name;

                const price = document.createElement("p");
                price.textContent = `₹${product.price} / sq.ft`;

                const removeButton = document.createElement("button");
                removeButton.className = "remove-wishlist";
                removeButton.textContent = "Remove";

                removeButton.addEventListener("click", function () {
                    wishlist = wishlist.filter(
                        item => item.id !== product.id
                    );

                    saveWishlist();
                    displayWishlist();
                    updateWishlistCount();
                });

                card.append(name, price, removeButton);
                container.appendChild(card);
            });
        }

        clearButton.addEventListener("click", function () {
            wishlist = [];
            saveWishlist();
            displayWishlist();
            updateWishlistCount();
        });

        displayWishlist();
        updateWishlistCount();

    })
    .catch(error => {
        console.error("Wishlist loading error:", error);
    });