
import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");
const showPassword = document.getElementById("showPassword");
const forgotPassword = document.getElementById("forgotPassword");

// Show / Hide Password
if (showPassword && passwordInput) {
    showPassword.addEventListener("click", function () {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            showPassword.textContent = "Hide";
        } else {
            passwordInput.type = "password";
            showPassword.textContent = "Show";
        }
    });
}


// Firebase Login
if (loginForm && emailInput && passwordInput && message) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        try {
            await signInWithEmailAndPassword(auth, email, password);

            message.textContent = "Login successful! Redirecting...";
            message.style.color = "green";

            localStorage.setItem("marviqueLoggedIn", "true");
            localStorage.setItem("marviqueUser", email);

            setTimeout(function () {
                window.location.href = "index.html";
            }, 1000);

        } catch (error) {
            if (
                error.code === "auth/invalid-credential" ||
                error.code === "auth/user-not-found" ||
                error.code === "auth/wrong-password"
            ) {
                message.textContent = "Incorrect email or password.";
            } else {
                message.textContent = "Login failed: " + error.message;
            }

            message.style.color = "red";
        }
    });
}

// Forgot Password
if (forgotPassword && emailInput && message) {
    forgotPassword.addEventListener("click", async function (event) {
        event.preventDefault();

        const email = emailInput.value.trim();

        if (!email) {
            message.textContent = "Please enter your email first.";
            message.style.color = "red";
            emailInput.focus();
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);

            message.textContent =
                "If the account exists, a password reset email will be sent.";
            message.style.color = "green";

        } catch (error) {
            message.textContent =
                "Unable to send reset email. Please check your email and try again.";
            message.style.color = "red";

            console.error(error);
        }
    });
}



// Forgot Password
/*if (forgotPassword && emailInput && message) {
    forgotPassword.addEventListener("click", async function (event) {
        event.preventDefault();

        const email = emailInput.value.trim();

        if (!email) {
            message.textContent = "Please enter your email first.";
            message.style.color = "red";
            emailInput.focus();
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);

            message.textContent =
                "If the account exists, a password reset email will be sent.";
            message.style.color = "green";

        } catch (error) {
            message.textContent =
                "Unable to send reset email. Please check your email and try again.";
            message.style.color = "red";

            console.error(error);
        }
    });
}*/
