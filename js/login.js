const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const message = document.getElementById("message");

const showPassword = document.getElementById("showPassword");


// Show / Hide Password

showPassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        showPassword.textContent = "Hide";

    } else {

        passwordInput.type = "password";

        showPassword.textContent = "Show";

    }

});


// Login

loginForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const email = emailInput.value.trim();

    const password = passwordInput.value;


    // Demo login details

    const demoEmail = "customer@marvique.com";

    const demoPassword = "123456";


    if (email === demoEmail && password === demoPassword) {

        localStorage.setItem(
            "marviqueLoggedIn",
            "true"
        );

        localStorage.setItem(
            "marviqueUser",
            email
        );


        message.textContent =
            "Login successful! Redirecting...";

        message.style.color = "green";


        setTimeout(function () {

            window.location.href = "index.html";

        }, 1000);


    } else {

        message.textContent =
            "Invalid email or password.";

        message.style.color = "red";

    }

});


// Forgot Password

document
    .getElementById("forgotPassword")
    .addEventListener("click", function (event) {

        event.preventDefault();

        alert(
            "Password reset feature can be connected later."
        );

    });