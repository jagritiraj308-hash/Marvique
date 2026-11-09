import { auth } from "./firebase-config.js";

import { recordCustomer } from "./js/customers.js";

import {
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitButton = signupForm.querySelector('button[type="submit"]');
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Creating account...";
    }

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (name) {
        await updateProfile(result.user, {
          displayName: name
        });
      }

      await recordCustomer(result.user, { event: "signup", name: name });

      localStorage.setItem("marviqueLoggedIn", "true");
      localStorage.setItem("marviqueUser", email);

      alert("Account created successfully!");
      window.location.href = "index.html";
    } catch (error) {
      console.error("Signup error:", error);

      let message = error.message;

      if (error.code === "auth/email-already-in-use") {
        message = "An account with this email already exists. Please log in.";
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak. Use at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      }

      alert("Signup failed: " + message);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Create Account";
      }
    }
  });
}
