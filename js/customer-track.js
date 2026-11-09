/* =========================
   CUSTOMER VISIT TRACKER
   Updates the customer's last visit when a signed-in user opens the site.
========================= */

import { auth } from "../firebase-config.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { recordCustomer } from "./customers.js";

onAuthStateChanged(auth, function (user) {
    if (!user) return;

    recordCustomer(user, { event: "visit" });
});
