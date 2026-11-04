/* =========================
   HERO
========================= */

fetch("sections/hero.html?v=20261106")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load hero.html");
        }
        return response.text();
    })
    .then(function (data) {
        const host = document.getElementById("hero-container");

        if (!host) return;

        host.innerHTML = data;

        const heroTitle = host.querySelector(".hero h1");

        if (!heroTitle) return;

        heroTitle.addEventListener("mouseenter", function () {
            heroTitle.style.transform = "scale(1.02)";
        });

        heroTitle.addEventListener("mouseleave", function () {
            heroTitle.style.transform = "scale(1)";
        });
    })
    .catch(function (error) {
        console.error("Hero loading error:", error);
    });
