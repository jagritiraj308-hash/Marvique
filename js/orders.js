/* =========================
   ORDERS (admin only)
========================= */

import { db } from "../firebase-config.js";
import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

export function subscribeToOrders(callback) {
    const ordersRef = ref(db, "orders");

    return onValue(
        ordersRef,
        function (snapshot) {
            const value = snapshot.val() || {};

            const orders = Object.keys(value)
                .map(function (key) {
                    return value[key];
                })
                .filter(function (order) {
                    return order && typeof order === "object";
                })
                .sort(function (a, b) {
                    return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
                });

            callback(orders);
        },
        function (error) {
            console.warn("Orders could not be loaded:", error);
            callback([], error);
        }
    );
}
