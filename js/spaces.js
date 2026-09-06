/* =========================
   SPACES
========================= */

fetch("sections/spaces.html")
    .then(response => response.text())
    .then(data => {

        document.getElementById("spaces").innerHTML = data;

        const spaces = document.querySelectorAll(".space-card");

        spaces.forEach(function (space) {

            space.addEventListener("click", function () {

                const title = space.querySelector("h3").textContent;

                console.log("Selected space:", title);

            });

        });

    })
    .catch(error => {
        console.error("Spaces section loading error:", error);
    });