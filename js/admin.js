document.addEventListener("DOMContentLoaded", function () {

    const loginBtn =
        document.getElementById("loginBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const loginBox =
        document.getElementById("adminLogin");

    const dashboard =
        document.getElementById("adminDashboard");

    const message =
        document.getElementById("loginMessage");


    if (loginBtn) {

        loginBtn.addEventListener(
            "click",
            function () {

                const username =
                    document.getElementById(
                        "adminUsername"
                    ).value;

                const password =
                    document.getElementById(
                        "adminPassword"
                    ).value;


                /*
                    Demo credentials only.
                    Do NOT use this method
                    for a real production website.
                */

                if (
                    username === "admin" &&
                    password === "12345"
                ) {

                    localStorage.setItem(
                        "marviqueAdmin",
                        "true"
                    );

                    showDashboard();

                } else {

                    message.textContent =
                        "Invalid username or password.";

                    message.style.color = "red";

                }

            }
        );

    }


    function showDashboard() {

        if (!loginBox || !dashboard)
            return;


        loginBox.style.display = "none";

        dashboard.style.display = "block";


        const wishlist =
            JSON.parse(
                localStorage.getItem(
                    "marviqueWishlist"
                )
            ) || [];


        const favorites =
            JSON.parse(
                localStorage.getItem(
                    "marviqueFavorites"
                )
            ) || [];


        document.getElementById(
            "adminWishlistCount"
        ).textContent = wishlist.length;


        document.getElementById(
            "adminFavoriteCount"
        ).textContent = favorites.length;


        document.getElementById(
            "productCount"
        ).textContent = 3;

    }


    function logout() {

        localStorage.removeItem(
            "marviqueAdmin"
        );

        dashboard.style.display =
            "none";

        loginBox.style.display =
            "block";

    }


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            logout
        );

    }


    const isLoggedIn =
        localStorage.getItem(
            "marviqueAdmin"
        );


    if (isLoggedIn === "true") {

        showDashboard();

    }

});