 
document.addEventListener("DOMContentLoaded", function () {
    const adminContainer = document.getElementById("admin");

    if (!adminContainer) {
        console.error("Admin container not found!");
        return;
    }

    // Load Admin Panel HTML
    fetch("sections/admin.html")
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Could not load admin.html");
            }
            return response.text();
        })
        .then(function (html) {
            adminContainer.innerHTML = html;
            initializeAdmin();
        })
        .catch(function (error) {
            console.error("Admin loading error:", error);
            adminContainer.innerHTML =
                "<p>Admin Panel load nahi hua. Live Server check karo.</p>";
        });

    function initializeAdmin() {
        const loginBtn = document.getElementById("loginBtn");
        const logoutBtn = document.getElementById("logoutBtn");
        const loginBox = document.getElementById("adminLogin");
        const dashboard = document.getElementById("adminDashboard");
        const loginMessage = document.getElementById("loginMessage");
        const addProductBtn = document.getElementById("addProductBtn");

        function showDashboard() {
            if (!loginBox || !dashboard) return;

            loginBox.style.display = "none";
            dashboard.style.display = "block";

            const wishlist =
                JSON.parse(localStorage.getItem("marviqueWishlist")) || [];

            const favorites =
                JSON.parse(localStorage.getItem("marviqueFavorites")) || [];

            const wishlistCount = document.getElementById("adminWishlistCount");
            const favoriteCount = document.getElementById("adminFavoriteCount");
            const productCount = document.getElementById("productCount");

            if (wishlistCount) wishlistCount.textContent = wishlist.length;
            if (favoriteCount) favoriteCount.textContent = favorites.length;

            if (productCount && typeof getProducts === "function") {
                productCount.textContent = getProducts().length;
            }
        }

        // Admin Login
        if (loginBtn) {
            loginBtn.addEventListener("click", function () {
                const username =
                    document.getElementById("adminUsername").value.trim();

                const password =
                    document.getElementById("adminPassword").value;

                if (username === "admin" && password === "12345") {
                    localStorage.setItem("marviqueAdmin", "true");
                    showDashboard();
                } else if (loginMessage) {
                    loginMessage.textContent =
                        "Invalid username or password.";
                    loginMessage.style.color = "red";
                }
            });
        }

        // Admin Logout
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function () {
                localStorage.removeItem("marviqueAdmin");

                if (dashboard) dashboard.style.display = "none";
                if (loginBox) loginBox.style.display = "block";
            });
        }

        // Add Product
        if (addProductBtn) {
            addProductBtn.addEventListener("click", function () {
                const name =
                    document.getElementById("newProductName").value.trim();

                const description =
                    document.getElementById("newProductDescription").value.trim();

                const price =
                    Number(document.getElementById("newProductPrice").value);

                const category =
                    document.getElementById("newProductCategory").value;

                const message = document.getElementById("productMessage");

                if (!localStorage.getItem("marviqueAdmin") ||
                    localStorage.getItem("marviqueAdmin") !== "true") {
                    if (message) {
                        message.textContent = "Please log in as admin first.";
                        message.style.color = "red";
                    }
                    return;
                }

                if (!name || !description || !Number.isFinite(price) || price < 1) {
                    if (message) {
                        message.textContent =
                            "Please enter a name, description and valid price.";
                        message.style.color = "red";
                    }
                    return;
                }

                if (typeof getProducts !== "function" ||
                    typeof saveProducts !== "function") {
                    if (message) {
                        message.textContent =
                            "Product functions not found. Check products.js.";
                        message.style.color = "red";
                    }
                    return;
                }

                const products = getProducts();

                products.push({
                    id: "product-" + Date.now(),
                    name: name,
                    description: description,
                    price: price,
                    category: category
                });

                saveProducts(products);

                document.getElementById("newProductName").value = "";
                document.getElementById("newProductDescription").value = "";
                document.getElementById("newProductPrice").value = "";

                if (message) {
                    message.textContent =
                        "Product saved! Refresh the page to view changes.";
                    message.style.color = "green";
                }

                const count = document.getElementById("productCount");
                if (count) count.textContent = products.length;

                // Notify Featured section if it supports product refresh
                document.dispatchEvent(
                    new CustomEvent("marviqueProductsUpdated")
                );
            });
        }

        // Restore admin session
        if (localStorage.getItem("marviqueAdmin") === "true") {
            showDashboard();
        }
    }
});
