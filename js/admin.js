/* =========================
   ADMIN PANEL
   Firebase Auth (admin emails only) + Realtime Database + Cloudinary uploads
========================= */

import { auth, isAdminEmail } from "../firebase-config.js";
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
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
import { subscribeToCustomers } from "./customers.js";

document.addEventListener("DOMContentLoaded", function () {
    const adminContainer = document.getElementById("admin");

    if (!adminContainer) {
        console.error("Admin container not found!");
        return;
    }

    fetch("admin.html?v=20261109b")
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
        const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
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
        const customerCount = document.getElementById("customerCount");
        const customerList = document.getElementById("adminCustomerList");

        let isAdmin = false;
        let previewUrl = null;
        let unsubscribeOrders = null;
        let unsubscribeCustomers = null;

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

        function formatDateTime(value) {
            if (!value) return "—";

            const date = new Date(value);

            if (isNaN(date.getTime())) return "—";

            return date.toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short"
            });
        }

        function providerLabel(user) {
            const provider =
                user && user.providerData && user.providerData[0]
                    ? user.providerData[0].providerId
                    : "password";

            const labels = {
                password: "Email & password",
                "google.com": "Google",
                "github.com": "GitHub",
                "facebook.com": "Facebook",
                "apple.com": "Apple"
            };

            return labels[provider] || provider;
        }

        function renderUserDetails(user) {
            const account = document.getElementById("adminAccount");

            if (!account || !user) return;

            const email = user.email || "—";

            const avatar = document.getElementById("adminAccountAvatar");
            const emailEl = document.getElementById("adminAccountEmail");
            const nameEl = document.getElementById("adminAccountName");
            const verifiedEl = document.getElementById("adminAccountVerified");
            const uidEl = document.getElementById("adminAccountUid");
            const providerEl = document.getElementById("adminAccountProvider");
            const createdEl = document.getElementById("adminAccountCreated");
            const lastLoginEl = document.getElementById("adminAccountLastLogin");

            if (avatar) avatar.textContent = (email.charAt(0) || "A").toUpperCase();
            if (emailEl) emailEl.textContent = email;
            if (nameEl) nameEl.textContent = user.displayName || "Not set";
            if (verifiedEl) {
                verifiedEl.textContent = user.emailVerified ? "Yes" : "No";
            }
            if (uidEl) uidEl.textContent = user.uid || "—";
            if (providerEl) providerEl.textContent = providerLabel(user);
            if (createdEl) {
                createdEl.textContent = formatDateTime(
                    user.metadata && user.metadata.creationTime
                );
            }
            if (lastLoginEl) {
                lastLoginEl.textContent = formatDateTime(
                    user.metadata && user.metadata.lastSignInTime
                );
            }

            account.hidden = false;
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

        function renderCustomers(customers, error) {
            const visibleCustomers = customers.filter(function (customer) {
                return !isAdminEmail(customer.email);
            });

            if (customerCount) {
                customerCount.textContent = visibleCustomers.length;
            }

            if (!customerList) return;

            customerList.innerHTML = "";

            if (error) {
                const message = document.createElement("p");
                message.className = "admin-order-empty";
                message.textContent =
                    "Customers could not be loaded. Deploy the updated database rules.";
                customerList.appendChild(message);
                return;
            }

            if (!visibleCustomers.length) {
                const message = document.createElement("p");
                message.className = "admin-order-empty";
                message.textContent = "No customers have signed in yet.";
                customerList.appendChild(message);
                return;
            }

            visibleCustomers.slice(0, 50).forEach(function (customer) {
                const card = document.createElement("article");
                card.className = "admin-customer";

                const head = document.createElement("div");
                head.className = "admin-customer-head";

                const title = document.createElement("strong");
                title.textContent =
                    customer.name || customer.email || "Customer";

                const badge = document.createElement("span");
                badge.className = "admin-customer-badge";
                badge.textContent = "CUSTOMER";

                head.append(title, badge);

                const email = document.createElement("p");
                email.className = "admin-customer-email";
                email.textContent = customer.email || "No email";

                const metaParts = [];

                if (customer.phone) {
                    metaParts.push("Phone: " + customer.phone);
                }

                metaParts.push(
                    customer.emailVerified
                        ? "Email verified"
                        : "Email not verified"
                );

                if (customer.provider) {
                    metaParts.push(customer.provider);
                }

                const meta = document.createElement("p");
                meta.className = "admin-order-meta";
                meta.textContent = metaParts.join(" · ");

                const footerParts = [];

                if (customer.lastLogin) {
                    footerParts.push(
                        "Last login: " + formatDateTime(customer.lastLogin)
                    );
                }

                if (customer.lastVisit) {
                    footerParts.push(
                        "Last visit: " + formatDateTime(customer.lastVisit)
                    );
                }

                if (customer.createdAt) {
                    footerParts.push(
                        "Joined: " + formatDateTime(customer.createdAt)
                    );
                }

                if (customer.uid) {
                    footerParts.push("UID: " + customer.uid);
                }

                const footer = document.createElement("p");
                footer.className = "admin-order-meta admin-order-footer";
                footer.textContent = footerParts.join(" · ");

                card.append(head, email, meta, footer);
                customerList.appendChild(card);
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

        function showDashboard(user) {
            if (!loginBox || !dashboard) return;

            loginBox.style.display = "none";
            dashboard.style.display = "block";

            renderUserDetails(user);
            updateCounts();

            if (!unsubscribeOrders) {
                unsubscribeOrders = subscribeToOrders(renderOrders);
            }

            if (!unsubscribeCustomers) {
                unsubscribeCustomers = subscribeToCustomers(renderCustomers);
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
                showDashboard(user);
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

        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener("click", async function () {
                const emailInput = document.getElementById("adminUsername");
                const email = emailInput ? emailInput.value.trim() : "";

                if (!email) {
                    setMessage(
                        loginMessage,
                        "Enter your admin email above, then tap Forgot password.",
                        "red"
                    );
                    if (emailInput) emailInput.focus();
                    return;
                }

                if (!isAdminEmail(email)) {
                    setMessage(
                        loginMessage,
                        "This email is not an admin account. Use the admin email you sign in with.",
                        "red"
                    );
                    return;
                }

                const originalLabel = forgotPasswordBtn.textContent;

                forgotPasswordBtn.disabled = true;
                forgotPasswordBtn.textContent = "Sending...";

                try {
                    await sendPasswordResetEmail(auth, email);

                    setMessage(
                        loginMessage,
                        "Password reset link sent to " +
                            email +
                            ". Check your inbox and spam folder.",
                        "green"
                    );
                } catch (error) {
                    console.error("Password reset error:", error);

                    if (error.code === "auth/user-not-found") {
                        setMessage(
                            loginMessage,
                            "No account found for this email.",
                            "red"
                        );
                    } else if (error.code === "auth/invalid-email") {
                        setMessage(
                            loginMessage,
                            "Enter a valid email address.",
                            "red"
                        );
                    } else if (error.code === "auth/too-many-requests") {
                        setMessage(
                            loginMessage,
                            "Too many attempts. Wait a few minutes and try again.",
                            "red"
                        );
                    } else {
                        setMessage(
                            loginMessage,
                            "Could not send the reset email. Please try again.",
                            "red"
                        );
                    }
                } finally {
                    forgotPasswordBtn.disabled = false;
                    forgotPasswordBtn.textContent = originalLabel;
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

                    if (unsubscribeCustomers) {
                        unsubscribeCustomers();
                        unsubscribeCustomers = null;
                    }

                    if (orderList) {
                        orderList.innerHTML =
                            '<p class="admin-order-empty">Log in as admin to load orders.</p>';
                    }

                    if (customerList) {
                        customerList.innerHTML =
                            '<p class="admin-order-empty">Log in as admin to load customers.</p>';
                    }

                    if (orderCount) {
                        orderCount.textContent = "0";
                    }

                    if (customerCount) {
                        customerCount.textContent = "0";
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
