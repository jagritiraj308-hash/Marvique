/* =========================
   HERO
========================= */

fetch("sections/hero.html")
    .then(response => response.text())
    .then(data => {

        document.getElementById("hero").innerHTML = data;

        const heroTitle = document.querySelector(".hero h1");

        heroTitle.addEventListener("mouseenter", function () {

            heroTitle.style.transform = "scale(1.02)";

        });

        heroTitle.addEventListener("mouseleave", function () {

            heroTitle.style.transform = "scale(1)";

        });

    })
    .catch(error => {
        console.error("Hero loading error:", error);
    });