document.addEventListener("DOMContentLoaded", function () {

    let favorites =
        JSON.parse(localStorage.getItem("marviqueFavorites")) || [];


    function saveFavorites() {

        localStorage.setItem(
            "marviqueFavorites",
            JSON.stringify(favorites)
        );

    }


    function updateFavoriteCount() {

        const count =
            document.getElementById("favoriteCount");

        if (count) {

            count.textContent =
                favorites.length;

        }

    }


    function addFavorite(product) {

        const exists =
            favorites.some(
                item => item.id === product.id
            );


        if (!exists) {

            favorites.push(product);

            saveFavorites();

            alert(product.name + " added to Favorites ⭐");

        } else {

            alert(
                product.name +
                " is already in Favorites."
            );

        }


        updateFavoriteCount();

        displayFavorites();

    }


    function removeFavorite(id) {

        favorites =
            favorites.filter(
                item => item.id !== id
            );

        saveFavorites();

        updateFavoriteCount();

        displayFavorites();

    }


    function displayFavorites() {

        const container =
            document.getElementById("favoriteItems");


        if (!container) return;


        if (favorites.length === 0) {

            container.innerHTML =
                "<p>Your favorites are empty ⭐</p>";

            return;

        }


        container.innerHTML = "";


        favorites.forEach(product => {

            const card =
                document.createElement("div");

            card.className =
                "saved-product-card";


            card.innerHTML = `

                <h3>${product.name}</h3>

                <p>
                    ₹${product.price} / sq.ft
                </p>

                <button
                    class="remove-favorite"
                    data-id="${product.id}">

                    Remove

                </button>

            `;


            container.appendChild(card);

        });


        document
            .querySelectorAll(".remove-favorite")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        removeFavorite(
                            this.dataset.id
                        );

                    }
                );

            });

    }


    document
        .querySelectorAll(".favorite-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const product = {

                        id: this.dataset.id,

                        name: this.dataset.name,

                        price: this.dataset.price

                    };


                    addFavorite(product);

                }
            );

        });


    const clearButton =
        document.getElementById("clearFavorites");


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                favorites = [];

                saveFavorites();

                updateFavoriteCount();

                displayFavorites();

            }
        );

    }


    updateFavoriteCount();

    displayFavorites();

});