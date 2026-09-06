/* =========================
   HEADER
========================= */

fetch("sections/header.html")
    .then(response => response.text())
    .then(data => {

        document.getElementById("header").innerHTML = data;

        const menuBtn = document.getElementById("menuBtn");
        const navbar = document.getElementById("navbar");
        const header = document.querySelector(".header");

        /* Mobile Menu */

        menuBtn.addEventListener("click", function () {

            navbar.classList.toggle("show");

            if (navbar.classList.contains("show")) {
                menuBtn.innerHTML = "✕";
            } else {
                menuBtn.innerHTML = "☰";
            }

        });


        /* Close menu after clicking link */

        const links = navbar.querySelectorAll("a");

        links.forEach(function (link) {

            link.addEventListener("click", function () {

                navbar.classList.remove("show");
                menuBtn.innerHTML = "☰";

            });

        });


        /* Header on Scroll */

        window.addEventListener("scroll", function () {

            if (window.scrollY > 50) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }

        });

    })
    .catch(error => {
        console.error("Header loading error:", error);
    });