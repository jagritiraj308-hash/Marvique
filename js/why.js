/* =========================
   WHY MARVIQUE
========================= */

fetch("sections/why.html?v=20261106")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load why.html");
        }
        return response.text();
    })
    .then(function (data) {
        const host = document.getElementById("why-container");

        if (!host) return;

        host.innerHTML = data;

        host.querySelectorAll(".why-card").forEach(function (card) {
            const icon = card.querySelector(".why-icon");

            if (!icon) return;

            card.addEventListener("mouseenter", function () {
                icon.style.transform = "rotate(10deg)";
            });

            card.addEventListener("mouseleave", function () {
                icon.style.transform = "rotate(0deg)";
            });
        });
    })
    .catch(function (error) {
        console.error("Why section loading error:", error);
    });
