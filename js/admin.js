/* =========================
   ADMIN PANEL
   Firebase Auth (admin emails only) + Realtime Database + Cloudinary uploads
========================= */

import { auth, isAdminEmail } from "../firebase-config.js";
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getProducts,
    addProduct,
    initProducts,
    onProductsChange,
    seedProductsIfEmpty,
    isCloudEnabled,
    getStorageMode
} from "./products.js";

import {
    uploadImage,
    validateImageFile,
    CloudinaryError
} from "./cloudinary.js";

import { isCloudinaryConfigured } from "../cloudinary-config.js";
import { subscribeToOrders } from "./orders.js";

document.addEventListener("DOMContentLoaded", function () {
    const adminContainer = document.getElementById("admin");

    if (!adminContainer) {
        console.error("Admin container not found!");
        return;
    }

    fetch("admin.html")
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
                "<p>Admin panel could not load. Refresh the page and try again.</p>";
        });

    function initializeAdmin() {
        const loginBtn = document.getElementById("loginBtn");
        const logoutBtn = document.getElementById("logoutBtn");
        const loginBox = document.getElementById("adminLogin");
        const dashboard = document.getElementById("adminDashboard");
        const loginMessage = document.getElementById("loginMessage");
        const addProductBtn = document.getElementById("addProductBtn");
        const storageStatus = document.getElementById("adminStorageStatus");
        const imageInput = document.getElementById("newProductImage");
        const imageStatus = document.getElementById("imageStatus");
        const preview = document.getElementById("imagePreview");
        const previewImage = document.getElementById("imagePreviewImg");
        const orderCount = document.getElementById("orderCount");
        const orderList = document.getElementById("adminOrderList");

        let isAdmin = false;
        let previewUrl = null;
        let unsubscribeOrders = null;

        /* ---------- helpers ---------- */

        function setMessage(element, text, color) {
            if (!element) return;
            element.textContent = text;
            element.style.color = color || "";
        }

        function updateCounts() {
            const wishlist = JSON.parse(
                localStorage.getItem("marviqueWishlist") || "[]"
            );
            const favorites = JSON.parse(
                localStorage.getItem("marviqueFavorites") || "[]"
            );

            const wishlistCount = document.getElementById("adminWishlistCount");
            const favoriteCount = document.getElementById("adminFavoriteCount");
            const productCount = document.getElementById("productCount");

            if (wishlistCount) wishlistCount.textContent = wishlist.length;
            if (favoriteCount) favoriteCount.textContent = favorites.length;
            if (productCount) productCount.textContent = getProducts().length;
        }

        function updateStorageStatus() {
            if (!storageStatus) return;

            if (isCloudEnabled()) {
                storageStatus.textContent =
                    "✓ Connected to Firebase Realtime Database. Changes are live for all visitors.";
                storageStatus.style.color = "#7ac77a";
            } else {
                storageStatus.textContent =
                    "⚠ Firebase Realtime Database unavailable. Products are saved in this browser only.";
                storageStatus.style.color = "#e0b25c";
            }

            if (!isCloudinaryConfigured() && imageStatus) {
                imageStatus.textContent =
                    "Cloudinary is not configured yet. Add cloudName and uploadPreset in cloudinary-config.js.";
                imageStatus.style.color = "#e0b25c";
            }
        }

        function formatAmount(paise) {
            return "₹" + (Number(paise || 0) / 100).toLocaleString("en-IN", {
                maximumFractionDigits: 2
            });
        }

        function renderOrders(orders, error) {
            if (orderCount) {
                orderCount.textContent = orders.length;
            }

            if (!orderList) return;

            orderList.innerHTML = "";

            if (error) {
                const message = document.createElement("p");
                message.className = "admin-order-empty";
                message.textContent =
                    "Orders could not be loaded. Deploy the updated database rules.";
                orderList.appendChild(message);
                return;
            }

            if (!orders.length) {
                const message = document.createElement("p");
                message.className = "admin-order-empty";
                message.textContent = "No orders yet.";
                orderList.appendChild(message);
                return;
            }

            const statusLabels = {
                paid: "PAID",
                authorized: "AUTHORIZED",
                created: "PENDING",
                failed: "FAILED"
            };

            orders.slice(0, 50).forEach(function (order) {
                const status = String(order.status || "created").toLowerCase();

                const card = document.createElement("article");
                card.className = "admin-order";

                const head = document.createElement("div");
                head.className = "admin-order-head";

                const title = document.createElement("strong");
                title.textContent = order.productName || order.productId || "Product";

                const badge = document.createElement("span");
                badge.className =
                    "admin-order-status admin-order-status--" + status;
                badge.textContent = statusLabels[status] || status.toUpperCase();

                head.append(title, badge);

                const details = document.createElement("p");
                details.className = "admin-order-meta";
                details.textContent =
                    (order.quantity || 0) +
                    " sq.ft × ₹" +
                    Number(order.unitPrice || 0).toLocaleString("en-IN") +
                    " = " +
                    formatAmount(order.amount);

                const customer = document.createElement("p");
                customer.className = "admin-order-customer";

                const customerName =
                    order.customer && order.customer.name
                        ? order.customer.name
                        : "Unknown customer";
                const customerPhone =
                    order.customer && order.customer.phone
                        ? " · " + order.customer.phone
                        : "";

                customer.textContent = customerName + customerPhone;

                const footer = document.createElement("p");
                footer.className = "admin-order-meta admin-order-footer";

                const created = order.createdAt
                    ? new Date(Number(order.createdAt)).toLocaleString("en-IN")
                    : "";

                footer.textContent =
                    created +
                    (order.paymentId ? " · " + order.paymentId : "");

                card.append(head, details, customer, footer);
                orderList.appendChild(card);
            });
        }

        function resetImagePreview() {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                previewUrl = null;
            }

            if (preview) preview.hidden = true;
            if (previewImage) previewImage.removeAttribute("src");
            if (imageInput) imageInput.value = "";
            if (imageStatus) imageStatus.textContent = "";
        }

        function setBusy(busy, label) {
            if (!addProductBtn) return;

            addProductBtn.disabled = busy;
            addProductBtn.textContent = busy ? (label || "Saving...") : "Add Product";
        }

        function showDashboard() {
            if (!loginBox || !dashboard) return;

            loginBox.style.display = "none";
            dashboard.style.display = "block";

            updateCounts();

            if (!unsubscribeOrders) {
                unsubscribeOrders = subscribeToOrders(renderOrders);
            }

            initProducts().then(function () {
                updateCounts();
                updateStorageStatus();

                if (isCloudEnabled()) {
                    seedProductsIfEmpty()
                        .then(function (result) {
                            if (result.seeded) {
                                console.info("Seeded Firebase with default products.");
                            }
                        })
                        .catch(function (error) {
                            console.warn("Could not seed products:", error);
                        });
                }
            });
        }

        function showLogin() {
            if (loginBox) loginBox.style.display = "block";
            if (dashboard) dashboard.style.display = "none";
        }

        /* ---------- auth state ---------- */

        onAuthStateChanged(auth, function (user) {
            if (user && isAdminEmail(user.email)) {
                isAdmin = true;
                setMessage(loginMessage, "");
                showDashboard();
                return;
            }

            isAdmin = false;
            showLogin();

            if (user) {
                setMessage(
                    loginMessage,
                    "This account is not an admin. Sign in with an admin email.",
                    "red"
                );
                signOut(auth).catch(function (error) {
                    console.error("Sign out error:", error);
                });
            }
        });

        /* ---------- login / logout ---------- */

        if (loginBtn) {
            loginBtn.addEventListener("click", async function () {
                const email = document.getElementById("adminUsername").value.trim();
                const password = document.getElementById("adminPassword").value;

                if (!email || !password) {
                    setMessage(loginMessage, "Enter your admin email and password.", "red");
                    return;
                }

                loginBtn.disabled = true;
                loginBtn.textContent = "Logging in...";

                try {
                    const credential = await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                    if (!isAdminEmail(credential.user.email)) {
                        await signOut(auth);
                        setMessage(
                            loginMessage,
                            "This account is not an admin.",
                            "red"
                        );
                        return;
                    }

                    setMessage(loginMessage, "Login successful!", "green");
                    document.getElementById("adminPassword").value = "";
                } catch (error) {
                    console.error("Firebase login error:", error);
                    setMessage(
                        loginMessage,
                        "Login failed. Check your email and password.",
                        "red"
                    );
                } finally {
                    loginBtn.disabled = false;
                    loginBtn.textContent = "Login";
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", async function () {
                try {
                    await signOut(auth);
                    isAdmin = false;

                    if (unsubscribeOrders) {
                        unsubscribeOrders();
                        unsubscribeOrders = null;
                    }

                    if (orderList) {
                        orderList.innerHTML =
                            '<p class="admin-order-empty">Log in as admin to load orders.</p>';
                    }

                    if (orderCount) {
                        orderCount.textContent = "0";
                    }

                    setMessage(loginMessage, "Logged out.", "green");
                    showLogin();
                } catch (error) {
                    console.error("Logout error:", error);
                }
            });
        }

        /* ---------- image preview ---------- */

        if (imageInput) {
            imageInput.addEventListener("change", function () {
                const file = imageInput.files && imageInput.files[0];

                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    previewUrl = null;
                }

                if (!file) {
                    if (preview) preview.hidden = true;
                    if (imageStatus) imageStatus.textContent = "";
                    return;
                }

                try {
                    validateImageFile(file);
                } catch (error) {
                    setMessage(imageStatus, error.message, "red");
                    imageInput.value = "";
                    if (preview) preview.hidden = true;
                    return;
                }

                previewUrl = URL.createObjectURL(file);

                if (previewImage) previewImage.src = previewUrl;
                if (preview) preview.hidden = false;

                setMessage(
                    imageStatus,
                    file.name + " — " + (file.size / 1024 / 1024).toFixed(2) + " MB",
                    "#aaa39a"
                );
            });
        }

        /* ---------- live product count ---------- */

        onProductsChange(function () {
            const productCount = document.getElementById("productCount");

            if (productCount) {
                productCount.textContent = getProducts().length;
            }
        });

        /* ---------- add product ---------- */

        if (addProductBtn) {
            addProductBtn.addEventListener("click", async function () {
                if (!isAdmin) {
                    setMessage(
                        document.getElementById("productMessage"),
                        "Please log in as admin first.",
                        "red"
                    );
                    return;
                }

                const name = document.getElementById("newProductName").value.trim();
                const description = document
                    .getElementById("newProductDescription")
                    .value.trim();
                const priceValue = document.getElementById("newProductPrice").value;
                const category = document.getElementById("newProductCategory").value;
                const file = imageInput && imageInput.files && imageInput.files[0];
                const message = document.getElementById("productMessage");

                if (!name) {
                    setMessage(message, "Please enter a product name.", "red");
                    return;
                }

                let price = null;

                if (priceValue !== "") {
                    price = Number(priceValue);

                    if (!Number.isFinite(price) || price <= 0) {
                        setMessage(message, "Please enter a valid price or leave it empty.", "red");
                        return;
                    }
                }

                setBusy(true, "Saving...");
                setMessage(message, "");

                try {
                    let imageUrl = "";

                    if (file) {
                        if (!isCloudinaryConfigured()) {
                            throw new CloudinaryError(
                                "Cloudinary is not configured. Add cloudName and uploadPreset in cloudinary-config.js.",
                                "cloudinary/not-configured"
                            );
                        }

                        setBusy(true, "Uploading image...");
                        setMessage(imageStatus, "Uploading image to Cloudinary...", "#c8a96b");

                        const uploaded = await uploadImage(file, {
                            onProgress: function (percent) {
                                setBusy(true, "Uploading " + percent + "%...");
                                setMessage(
                                    imageStatus,
                                    "Uploading image... " + percent + "%",
                                    "#c8a96b"
                                );
                            }
                        });

                        imageUrl = uploaded.url;
                        setMessage(imageStatus, "Image uploaded ✓", "green");
                    }

                    const product = {
                        id: "product-" + Date.now(),
                        name: name,
                        description: description,
                        price: price,
                        category: category,
                        image: imageUrl,
                        createdAt: new Date().toISOString()
                    };

                    setBusy(true, "Saving...");

                    const result = await addProduct(product);

                    document.getElementById("newProductName").value = "";
                    document.getElementById("newProductDescription").value = "";
                    document.getElementById("newProductPrice").value = "";
                    resetImagePreview();

                    if (result.savedToCloud) {
                        setMessage(
                            message,
                            "Product added and synced to Firebase. It is live for all visitors.",
                            "green"
                        );
                    } else {
                        setMessage(
                            message,
                            "Product saved in this browser only — Firebase sync failed. Check your Realtime Database and rules.",
                            "#e0b25c"
                        );
                    }

                    updateStorageStatus();
                } catch (error) {
                    console.error("Add product error:", error);

                    if (error instanceof CloudinaryError) {
                        setMessage(message, error.message, "red");
                        setMessage(imageStatus, error.message, "red");
                    } else {
                        setMessage(
                            message,
                            "Could not add product: " + error.message,
                            "red"
                        );
                    }
                } finally {
                    setBusy(false);
                }
            });
        }

        /* ---------- initial state ---------- */

        updateStorageStatus();
        updateCounts();

        if (getStorageMode() === "local") {
            initProducts().then(updateStorageStatus);
        }
    }
});
