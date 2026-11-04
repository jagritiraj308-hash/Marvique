/* =========================
   MARVIQUE PAYMENT FUNCTIONS
   Razorpay order creation + signature verification.
========================= */

const crypto = require("crypto");
const Razorpay = require("razorpay");
const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

admin.initializeApp();

setGlobalOptions({
    region: "asia-south1",
    maxInstances: 10
});

const db = admin.database();

const MIN_AMOUNT_PAISE = 100;
const MAX_AMOUNT_PAISE = 500000000; // ₹50,00,000
const MAX_QUANTITY = 100000;

function getRazorpay() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new HttpsError(
            "failed-precondition",
            "Razorpay keys are not configured on the server."
        );
    }

    return {
        keyId: keyId,
        keySecret: keySecret,
        client: new Razorpay({ key_id: keyId, key_secret: keySecret })
    };
}

function cleanText(value, maxLength) {
    return String(value == null ? "" : value).trim().slice(0, maxLength);
}

function sanitizeCustomer(input) {
    const source = input && typeof input === "object" ? input : {};

    const customer = {
        name: cleanText(source.name, 80),
        phone: cleanText(source.phone, 20),
        email: cleanText(source.email, 120),
        address: cleanText(source.address, 300)
    };

    if (customer.name.length < 2) {
        throw new HttpsError("invalid-argument", "A valid customer name is required.");
    }

    if (
        !/^[0-9+\-\s()]{7,20}$/.test(customer.phone) ||
        customer.phone.replace(/\D/g, "").length < 7
    ) {
        throw new HttpsError("invalid-argument", "A valid phone number is required.");
    }

    if (
        customer.email &&
        !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)
    ) {
        throw new HttpsError("invalid-argument", "The email address is not valid.");
    }

    return customer;
}

function sanitizeProductId(value) {
    const productId = cleanText(value, 80);

    if (!/^[A-Za-z0-9_-]{1,80}$/.test(productId)) {
        throw new HttpsError("invalid-argument", "Invalid product id.");
    }

    return productId;
}

function sanitizeQuantity(value) {
    const quantity = Number(value);

    if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_QUANTITY
    ) {
        throw new HttpsError(
            "invalid-argument",
            "Quantity must be a whole number between 1 and " + MAX_QUANTITY + "."
        );
    }

    return quantity;
}

/* ---------- create order ---------- */

exports.createRazorpayOrder = onCall(async function (request) {
    const data = request.data && typeof request.data === "object"
        ? request.data
        : {};

    const productId = sanitizeProductId(data.productId);
    const quantity = sanitizeQuantity(data.quantity);
    const customer = sanitizeCustomer(data.customer);

    let product;

    try {
        const snapshot = await db.ref("products/" + productId).get();

        if (!snapshot.exists()) {
            throw new HttpsError("not-found", "Product not found.");
        }

        product = snapshot.val() || {};
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        console.error("Could not read product:", error);
        throw new HttpsError("internal", "Could not load the product.");
    }

    const unitPrice = Number(product.price);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        throw new HttpsError(
            "failed-precondition",
            "This product is not available for online purchase."
        );
    }

    const amount = Math.round(unitPrice * quantity * 100);

    if (amount < MIN_AMOUNT_PAISE) {
        throw new HttpsError("invalid-argument", "Order amount is too small.");
    }

    if (amount > MAX_AMOUNT_PAISE) {
        throw new HttpsError(
            "invalid-argument",
            "Order amount is too large. Please contact us directly."
        );
    }

    const razorpay = getRazorpay();

    let order;

    try {
        order = await razorpay.client.orders.create({
            amount: amount,
            currency: "INR",
            receipt: "mvq_" + Date.now(),
            payment_capture: 1,
            notes: {
                productId: productId,
                productName: cleanText(product.name, 100),
                quantity: String(quantity)
            }
        });
    } catch (error) {
        console.error("Razorpay order creation failed:", error);
        throw new HttpsError(
            "internal",
            "The payment provider could not start this order. Please try again."
        );
    }

    try {
        await db.ref("orders/" + order.id).set({
            orderId: order.id,
            status: "created",
            productId: productId,
            productName: cleanText(product.name, 120),
            productImage: cleanText(product.image, 500),
            quantity: quantity,
            unitPrice: unitPrice,
            amount: amount,
            currency: "INR",
            customer: customer,
            createdAt: admin.database.ServerValue.TIMESTAMP
        });
    } catch (error) {
        console.error("Could not save order record:", error);
        throw new HttpsError("internal", "Could not save the order.");
    }

    return {
        orderId: order.id,
        amount: amount,
        currency: "INR",
        keyId: razorpay.keyId,
        productName: cleanText(product.name, 120),
        unitPrice: unitPrice,
        quantity: quantity
    };
});

/* ---------- verify payment ---------- */

exports.verifyRazorpayPayment = onCall(async function (request) {
    const data = request.data && typeof request.data === "object"
        ? request.data
        : {};

    const orderId = cleanText(data.razorpay_order_id, 100);
    const paymentId = cleanText(data.razorpay_payment_id, 100);
    const signature = cleanText(data.razorpay_signature, 200);

    if (!orderId || !paymentId || !signature) {
        throw new HttpsError("invalid-argument", "Payment details are incomplete.");
    }

    const razorpay = getRazorpay();

    const expectedSignature = crypto
        .createHmac("sha256", razorpay.keySecret)
        .update(orderId + "|" + paymentId)
        .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const actualBuffer = Buffer.from(signature, "utf8");

    const signatureValid =
        expectedBuffer.length === actualBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, actualBuffer);

    if (!signatureValid) {
        console.warn("Invalid Razorpay signature for order", orderId);
        throw new HttpsError(
            "permission-denied",
            "Payment signature verification failed."
        );
    }

    let payment;
    let order;

    try {
        const results = await Promise.all([
            razorpay.client.payments.fetch(paymentId),
            razorpay.client.orders.fetch(orderId)
        ]);

        payment = results[0];
        order = results[1];
    } catch (error) {
        console.error("Could not fetch Razorpay payment:", error);
        throw new HttpsError(
            "internal",
            "Could not verify the payment with Razorpay."
        );
    }

    if (payment.order_id !== orderId) {
        throw new HttpsError("permission-denied", "Payment does not match this order.");
    }

    if (Number(payment.amount) !== Number(order.amount)) {
        throw new HttpsError("permission-denied", "Payment amount does not match this order.");
    }

    if (payment.currency !== order.currency) {
        throw new HttpsError("permission-denied", "Payment currency does not match this order.");
    }

    if (payment.status !== "captured" && payment.status !== "authorized") {
        throw new HttpsError(
            "failed-precondition",
            "The payment has not been completed."
        );
    }

    try {
        await db.ref("orders/" + orderId).update({
            status: payment.status === "captured" ? "paid" : "authorized",
            paymentId: paymentId,
            method: payment.method || "",
            verified: true,
            paidAt: admin.database.ServerValue.TIMESTAMP
        });
    } catch (error) {
        console.error("Could not update order record:", error);
        throw new HttpsError("internal", "Payment verified but the order could not be updated.");
    }

    return {
        ok: true,
        status: payment.status === "captured" ? "paid" : "authorized"
    };
});
