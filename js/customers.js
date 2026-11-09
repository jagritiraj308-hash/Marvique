/* =========================
   CUSTOMERS
   Records signed-in customers and streams them to the admin panel.
========================= */

import { db } from "../firebase-config.js";
import {
    ref,
    update,
    onValue
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

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

/*
  Save or update a customer record in Firebase.

  options.event:
    "login"  - signed in with email/password
    "signup" - created a new account
    "visit"  - opened the site while already signed in
*/
export function recordCustomer(user, options) {
    if (!user || !user.uid) {
        return Promise.resolve(false);
    }

    const settings = options || {};
    const now = Date.now();

    const payload = {
        uid: user.uid,
        email: user.email || "",
        emailVerified: !!user.emailVerified,
        provider: providerLabel(user),
        lastSeen: now,
        lastVisit: now
    };

    const name = user.displayName || settings.name || "";

    if (name) payload.name = name;
    if (user.phoneNumber) payload.phone = user.phoneNumber;
    if (settings.phone) payload.phone = settings.phone;

    if (user.metadata && user.metadata.creationTime) {
        const created = Date.parse(user.metadata.creationTime);

        if (!isNaN(created)) payload.createdAt = created;
    }

    if (settings.event === "login" || settings.event === "signup") {
        payload.lastLogin = now;
    }

    if (settings.event === "signup") {
        payload.joinedAt = now;
    }

    return update(ref(db, "customers/" + user.uid), payload)
        .then(function () {
            return true;
        })
        .catch(function (error) {
            console.warn("Customer record could not be saved:", error);
            return false;
        });
}

export function subscribeToCustomers(callback) {
    const customersRef = ref(db, "customers");

    return onValue(
        customersRef,
        function (snapshot) {
            const value = snapshot.val() || {};

            const customers = Object.keys(value)
                .map(function (key) {
                    const record = value[key];

                    return record && typeof record === "object"
                        ? Object.assign({ uid: key }, record)
                        : null;
                })
                .filter(Boolean)
                .sort(function (a, b) {
                    return (
                        (Number(b.lastSeen) || 0) -
                        (Number(a.lastSeen) || 0)
                    );
                });

            callback(customers);
        },
        function (error) {
            console.warn("Customers could not be loaded:", error);
            callback([], error);
        }
    );
}
