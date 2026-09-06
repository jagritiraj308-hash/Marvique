/* =========================
   WHY MARVIQUE
========================= */

fetch("sections/why.html")
    .then(response => response.text())
    .then(data => {

        document.getElementById("why").innerHTML = data;

        const cards = document.querySelectorAll(".why-card");

        cards.forEach(function (card) {

            card.addEventListener("mouseenter", function () {

                const icon = card.querySelector(".why-icon");

                icon.style.transform = "rotate(10deg)";

            });

            card.addEventListener("mouseleave", function () {

                const icon = card.querySelector(".why-icon");

                icon.style.transform = "rotate(0deg)";

            });

        });

    })
    .catch(error => {
        console.error("Why section loading error:", error);
    });