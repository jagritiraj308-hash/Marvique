/* =========================
   BUY NOW / RAZORPAY CHECKOUT
========================= */

import { app } from "../firebase-config.js";
import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-functions.js";

import {
    RAZORPAY_CONFIG,
    isRazorpayConfigured
} from "../razorpay-config.js";

const CUSTOMER_KEY = "marviqueCustomer";
const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

let checkoutPromise = null;
let modal = null;
let activeProduct = null;
let activeOrder = null;
let submitting = false;

/* ---------- helpers ---------- */

function formatMoney(rupees) {
    return "₹" + Number(rupees).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function readSavedCustomer() {
    try {
        const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "{}");
        return saved && typeof saved === "object" ? saved : {};
    } catch (error) {
        return {};
    }
}

function saveCustomer(customer) {
    try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    } catch (error) {
        /* storage may be full or blocked; checkout still works */
    }
}

function loadCheckoutScript() {
    if (window.Razorpay) return Promise.resolve();

    if (checkoutPromise) return checkoutPromise;

    checkoutPromise = new Promise(function (resolve, reject) {
        const script = document.createElement("script");
        script.src = CHECKOUT_SCRIPT;
        script.async = true;
        script.onload = function () {
            resolve();
        };
        script.onerror = function () {
            checkoutPromise = null;
            reject(new Error("Could not load Razorpay Checkout. Check your connection."));
        };
        document.head.appendChild(script);
    });

    return checkoutPromise;
}

function whatsappLink(product, customer, quantity) {
    const total =
        product.price != null ? Number(product.price) * quantity : null;

    const lines = [
        "Hi Marvique Tiles & Marble, I would like to order:",
        "",
        "Product: " + product.name,
        "Quantity: " + quantity + " sq.ft",
        total != null ? "Total: " + formatMoney(total) : "",
        "Name: " + customer.name,
        "Phone: " + customer.phone,
        customer.email ? "Email: " + customer.email : "",
        customer.address ? "Address: " + customer.address : ""
    ].filter(Boolean);

    return (
        "https://wa.me/" +
        RAZORPAY_CONFIG.whatsappNumber +
        "?text=" +
        encodeURIComponent(lines.join("\n"))
    );
}

function setMessage(text, tone) {
    if (!modal) return;

    modal.message.textContent = text || "";
    modal.message.className = "buy-message" + (tone ? " buy-message--" + tone : "");
}

function setBusy(busy, label) {
    submitting = busy;

    if (!modal) return;

    modal.payButton.disabled = busy;
    modal.payButton.textContent = busy ? label || "Please wait..." : "Pay securely";
}

function showWhatsAppFallback(customer, quantity) {
    if (!modal || !activeProduct) return;

    modal.fallback.hidden = false;
    modal.fallbackLink.href = whatsappLink(activeProduct, customer, quantity);
}

function resetModal(product) {
    activeProduct = product;
    activeOrder = null;

    const saved = readSavedCustomer();

    modal.title.textContent = product.name;
    modal.priceLine.textContent =
        product.price != null
            ? formatMoney(product.price) + " / sq.ft"
            : "Price on request";
    modal.categoryLine.textContent = product.category || "";
    modal.quantity.value = 100;
    modal.name.value = saved.name || "";
    modal.phone.value = saved.phone || "";
    modal.email.value = saved.email || "";
    modal.address.value = saved.address || "";

    if (product.image) {
        modal.thumb.style.backgroundImage =
            'url("' + String(product.image).replace(/"/g, "%22") + '")';
        modal.thumb.hidden = false;
    } else {
        modal.thumb.style.backgroundImage = "";
        modal.thumb.hidden = true;
    }

    modal.form.hidden = false;
    modal.success.hidden = true;
    modal.fallback.hidden = true;
    modal.payButton.disabled = false;
    modal.payButton.textContent = "Pay securely";
    modal.quantity.disabled = false;
    modal.closeButton.hidden = false;

    setMessage("");
    updateTotal();
    submitting = false;
}

function updateTotal() {
    if (!modal || !activeProduct) return;

    const quantity = Math.max(0, Math.floor(Number(modal.quantity.value) || 0));
    const price = Number(activeProduct.price);
    const total = Number.isFinite(price) ? price * quantity : 0;

    modal.total.textContent = formatMoney(total);
}

/* ---------- modal ---------- */

function ensureModal() {
    if (modal) return modal;

    const overlay = document.createElement("div");
    overlay.className = "buy-overlay";
    overlay.hidden = true;

    overlay.innerHTML = [
        '<div class="buy-dialog" role="dialog" aria-modal="true" aria-labelledby="buyTitle">',
        '  <button type="button" class="buy-close" data-buy-close aria-label="Close checkout">×</button>',
        '  <div class="buy-body">',
        '    <p class="buy-eyebrow">SECURE CHECKOUT</p>',
        '    <h3 class="buy-title" id="buyTitle">Buy <span data-buy-name></span></h3>',
        '    <div class="buy-summary">',
        '      <div class="buy-thumb" data-buy-thumb hidden></div>',
        '      <div>',
        '        <p class="buy-price" data-buy-price></p>',
        '        <p class="buy-category" data-buy-category></p>',
        '      </div>',
        '    </div>',
        '    <form class="buy-form" data-buy-form novalidate>',
        '      <label class="buy-field">',
        '        <span>Quantity (sq.ft)</span>',
        '        <input type="number" data-buy-quantity min="1" step="1" value="100" inputmode="numeric" required>',
        '      </label>',
        '      <div class="buy-total"><span>Total</span><strong data-buy-total>₹0</strong></div>',
        '      <label class="buy-field">',
        '        <span>Full name</span>',
        '        <input type="text" data-buy-customer-name autocomplete="name" maxlength="80" required>',
        '      </label>',
        '      <label class="buy-field">',
        '        <span>Phone</span>',
        '        <input type="tel" data-buy-customer-phone autocomplete="tel" maxlength="20" required>',
        '      </label>',
        '      <label class="buy-field">',
        '        <span>Email (optional)</span>',
        '        <input type="email" data-buy-customer-email autocomplete="email" maxlength="120">',
        '      </label>',
        '      <label class="buy-field">',
        '        <span>Delivery address (optional)</span>',
        '        <textarea data-buy-customer-address maxlength="300" rows="2"></textarea>',
        '      </label>',
        '      <button type="submit" class="buy-pay" data-buy-pay>Pay securely</button>',
        '      <p class="buy-message" data-buy-message role="status"></p>',
        '      <div class="buy-fallback" data-buy-fallback hidden>',
        '        <a class="buy-whatsapp" data-buy-whatsapp href="https://wa.me/919931614860" target="_blank" rel="noopener">',
        '          Send order on WhatsApp',
        '        </a>',
        '      </div>',
        '      <p class="buy-note">Payments are processed securely by Razorpay. Your order is confirmed only after payment verification.</p>',
        '    </form>',
        '    <div class="buy-success" data-buy-success hidden>',
        '      <div class="buy-success-icon">✓</div>',
        '      <h4>Payment successful</h4>',
        '      <p>Thank you! We have received your order and will contact you shortly.</p>',
        '      <dl class="buy-success-details">',
        '        <div><dt>Order ID</dt><dd data-buy-success-order></dd></div>',
        '        <div><dt>Payment ID</dt><dd data-buy-success-payment></dd></div>',
        '        <div><dt>Amount paid</dt><dd data-buy-success-amount></dd></div>',
        '      </dl>',
        '      <a class="buy-whatsapp" data-buy-success-whatsapp href="https://wa.me/919931614860" target="_blank" rel="noopener">Send order details on WhatsApp</a>',
        '      <button type="button" class="buy-pay" data-buy-close>Done</button>',
        '    </div>',
        '  </div>',
        '</div>'
    ].join("\n");

    document.body.appendChild(overlay);

    const find = function (selector) {
        return overlay.querySelector(selector);
    };

    modal = {
        overlay: overlay,
        closeButton: find("[data-buy-close]"),
        title: find("[data-buy-name]"),
        priceLine: find("[data-buy-price]"),
        categoryLine: find("[data-buy-category]"),
        thumb: find("[data-buy-thumb]"),
        form: find("[data-buy-form]"),
        quantity: find("[data-buy-quantity]"),
        total: find("[data-buy-total]"),
        name: find("[data-buy-customer-name]"),
        phone: find("[data-buy-customer-phone]"),
        email: find("[data-buy-customer-email]"),
        address: find("[data-buy-customer-address]"),
        payButton: find("[data-buy-pay]"),
        message: find("[data-buy-message]"),
        fallback: find("[data-buy-fallback]"),
        fallbackLink: find("[data-buy-whatsapp]"),
        success: find("[data-buy-success]"),
        successOrder: find("[data-buy-success-order]"),
        successPayment: find("[data-buy-success-payment]"),
        successAmount: find("[data-buy-success-amount]"),
        successWhatsapp: find("[data-buy-success-whatsapp]")
    };

    modal.quantity.addEventListener("input", updateTotal);

    overlay.querySelectorAll("[data-buy-close]").forEach(function (button) {
        button.addEventListener("click", closeModal);
    });

    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) closeModal();
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !overlay.hidden) closeModal();
    });

    modal.form.addEventListener("submit", submitOrder);

    return modal;
}

function openModal(product) {
    ensureModal();
    resetModal(product);

    modal.overlay.hidden = false;
    document.body.classList.add("buy-open");

    setTimeout(function () {
        if (modal && !modal.quantity.disabled) modal.quantity.focus();
    }, 50);
}

function closeModal() {
    if (!modal) return;

    modal.overlay.hidden = true;
    document.body.classList.remove("buy-open");
    setBusy(false);
}

/* ---------- validation ---------- */

function readCustomer() {
    const customer = {
        name: modal.name.value.trim(),
        phone: modal.phone.value.trim(),
        email: modal.email.value.trim(),
        address: modal.address.value.trim()
    };

    if (customer.name.length < 2) {
        throw new Error("Please enter your full name.");
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(customer.phone) ||
        customer.phone.replace(/\D/g, "").length < 7) {
        throw new Error("Please enter a valid phone number.");
    }

    if (customer.email &&
        !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)) {
        throw new Error("Please enter a valid email address or leave it empty.");
    }

    return customer;
}

function readQuantity() {
    const quantity = Math.floor(Number(modal.quantity.value));

    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Please enter a quantity of at least 1 sq.ft.");
    }

    if (quantity > 100000) {
        throw new Error("For quantities above 100,000 sq.ft please contact us directly.");
    }

    return quantity;
}

/* ---------- payment ---------- */

function friendlyError(error) {
    const code = error && error.code ? String(error.code) : "";
    const message = error && error.message ? String(error.message) : "";

    if (code.includes("not-found")) {
        return "The payment server is not deployed yet. Please use WhatsApp to place your order.";
    }

    if (code.includes("unavailable") || code.includes("internal")) {
        return "The payment server is unavailable right now. Please try WhatsApp.";
    }

    if (code.includes("failed-precondition") || code.includes("invalid-argument")) {
        return message || "This order could not be started. Please try again.";
    }

    return message || "Could not start the payment. Please try again.";
}

function getFunctionsInstance() {
    return getFunctions(app, RAZORPAY_CONFIG.functionsRegion);
}

async function submitOrder(event) {
    event.preventDefault();

    if (submitting || !activeProduct) return;

    let customer;
    let quantity;

    try {
        quantity = readQuantity();
        customer = readCustomer();
    } catch (error) {
        setMessage(error.message, "error");
        return;
    }

    saveCustomer(customer);

    if (!isRazorpayConfigured()) {
        setMessage(
            "Online payment is not configured yet. Send your order on WhatsApp and we will confirm it.",
            "warning"
        );
        showWhatsAppFallback(customer, quantity);
        return;
    }

    setMessage("");
    setBusy(true, "Starting payment...");

    try {
        const createOrder = httpsCallable(
            getFunctionsInstance(),
            "createRazorpayOrder"
        );

        const response = await createOrder({
            productId: activeProduct.id,
            quantity: quantity,
            customer: customer
        });

        const order = response.data;

        activeOrder = {
            orderId: order.orderId,
            amount: order.amount,
            quantity: quantity,
            customer: customer
        };

        await loadCheckoutScript();
        openCheckout(order, customer, quantity);
    } catch (error) {
        console.error("Could not start Razorpay payment:", error);
        setMessage(friendlyError(error), "error");
        showWhatsAppFallback(customer, quantity);
        setBusy(false);
    }
}

function openCheckout(order, customer, quantity) {
    const options = {
        key: order.keyId || RAZORPAY_CONFIG.keyId,
        amount: order.amount,
        currency: order.currency || RAZORPAY_CONFIG.currency,
        name: RAZORPAY_CONFIG.companyName,
        description: activeProduct.name + " — " + quantity + " sq.ft",
        order_id: order.orderId,
        prefill: {
            name: customer.name,
            email: customer.email,
            contact: customer.phone
        },
        notes: {
            productId: activeProduct.id,
            quantity: String(quantity)
        },
        theme: {
            color: RAZORPAY_CONFIG.themeColor
        },
        handler: function (response) {
            verifyPayment(response);
        },
        modal: {
            ondismiss: function () {
                setBusy(false);
                setMessage("Payment cancelled. You can try again.", "warning");
            }
        }
    };

    if (RAZORPAY_CONFIG.companyLogo) {
        options.image = RAZORPAY_CONFIG.companyLogo;
    } else if (activeProduct.image) {
        options.image = activeProduct.image;
    }

    const checkout = new window.Razorpay(options);

    checkout.on("payment.failed", function (response) {
        console.error("Razorpay payment failed:", response && response.error);
        setBusy(false);
        setMessage(
            "Payment failed: " +
            ((response && response.error && response.error.description) ||
                "please try again."),
            "error"
        );
    });

    checkout.open();
}

async function verifyPayment(response) {
    setBusy(true, "Verifying payment...");
    setMessage("");

    try {
        const verify = httpsCallable(
            getFunctionsInstance(),
            "verifyRazorpayPayment"
        );

        const result = await verify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
        });

        showSuccess(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            activeOrder ? activeOrder.amount : 0
        );
    } catch (error) {
        console.error("Payment verification failed:", error);
        setMessage(
            "We could not verify this payment automatically. " +
            "Please contact us on WhatsApp with your payment ID: " +
            response.razorpay_payment_id,
            "error"
        );
        if (activeOrder) {
            showWhatsAppFallback(activeOrder.customer, activeOrder.quantity);
        }
        setBusy(false);
    }
}

function showSuccess(orderId, paymentId, amountPaise) {
    if (!modal) return;

    modal.form.hidden = true;
    modal.success.hidden = false;
    modal.closeButton.hidden = false;

    modal.successOrder.textContent = orderId;
    modal.successPayment.textContent = paymentId;
    modal.successAmount.textContent = formatMoney(Number(amountPaise) / 100);

    if (activeOrder) {
        modal.successWhatsapp.href = whatsappLink(
            activeProduct,
            activeOrder.customer,
            activeOrder.quantity
        );
    }

    setBusy(false);
}

/* ---------- public API ---------- */

export function openBuyModal(product) {
    if (!product) return;

    const price = Number(product.price);

    if (!Number.isFinite(price) || price <= 0) {
        alert("This product is available on request. Please contact us for pricing.");
        return;
    }

    openModal(product);
}
