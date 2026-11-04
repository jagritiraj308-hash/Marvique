/* =========================
   SPACES
========================= */

fetch("sections/spaces.html?v=20261106")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load spaces.html");
        }
        return response.text();
    })
    .then(function (data) {
        const host = document.getElementById("spaces-container");

        if (!host) return;

        host.innerHTML = data;

        host.querySelectorAll(".space-card").forEach(function (space) {
            space.addEventListener("click", function () {
                const title = space.querySelector("h3");

                if (title) {
                    console.log("Selected space:", title.textContent);
                }
            });
        });
    })
    .catch(function (error) {
        console.error("Spaces section loading error:", error);
    });
