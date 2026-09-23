document.addEventListener("DOMContentLoaded", function () {

    let wishlist =
        JSON.parse(localStorage.getItem("marviqueWishlist")) || [];


    function saveWishlist() {

        localStorage.setItem(
            "marviqueWishlist",
            JSON.stringify(wishlist)
        );

    }


    function updateWishlistCount() {

        const countElement =
            document.getElementById("wishlistCount");

        if (countElement) {

            countElement.textContent =
                wishlist.length;

        }

    }


    function addToWishlist(product) {

        const alreadyExists =
            wishlist.some(item => item.id === product.id);

        if (!alreadyExists) {

            wishlist.push(product);

            saveWishlist();

            alert(product.name + " added to Wishlist ❤️");

        } else {

            alert(product.name + " is already in Wishlist.");

        }

        updateWishlistCount();

        displayWishlist();

    }


    function removeFromWishlist(id) {

        wishlist =
            wishlist.filter(item => item.id !== id);

        saveWishlist();

        updateWishlistCount();

        displayWishlist();

    }


    function displayWishlist() {

        const container =
            document.getElementById("wishlistItems");

        if (!container) return;


        if (wishlist.length === 0) {

            container.innerHTML =
                "<p>Your wishlist is empty ❤️</p>";

            return;

        }


        container.innerHTML = "";


        wishlist.forEach(product => {

            const card =
                document.createElement("div");

            card.className = "saved-product-card";


            card.innerHTML = `

                <h3>${product.name}</h3>

                <p>
                    ₹${product.price} / sq.ft
                </p>

                <button
                    class="remove-wishlist"
                    data-id="${product.id}">

                    Remove

                </button>

            `;


            container.appendChild(card);

        });


        document
            .querySelectorAll(".remove-wishlist")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        removeFromWishlist(
                            this.dataset.id
                        );

                    }
                );

            });

    }


    document
        .querySelectorAll(".wishlist-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const product = {

                        id: this.dataset.id,

                        name: this.dataset.name,

                        price: this.dataset.price

                    };


                    addToWishlist(product);

                }
            );

        });


    const clearButton =
        document.getElementById("clearWishlist");


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                wishlist = [];

                saveWishlist();

                updateWishlistCount();

                displayWishlist();

            }
        );

    }


    updateWishlistCount();

    displayWishlist();

});