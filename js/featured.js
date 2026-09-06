/* =========================
   FEATURED COLLECTION
========================= */

fetch("sections/featured.html")
    .then(response => response.text())
    .then(data => {

        document.getElementById("featured").innerHTML = data;

        const cards = document.querySelectorAll(".product-card");

        cards.forEach(function (card) {

            card.addEventListener("mouseenter", function () {
                card.style.transform = "translateY(-8px)";
            });

            card.addEventListener("mouseleave", function () {
                card.style.transform = "translateY(0)";
            });

        });

    })
    .catch(error => {
        console.error("Featured section loading error:", error);
    });