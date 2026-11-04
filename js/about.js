/* =========================
   ABOUT SECTION
========================= */

fetch("sections/about.html?v=20261106")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load about.html");
        }
        return response.text();
    })
    .then(function (data) {
        const host = document.getElementById("about-container");

        if (host) {
            host.innerHTML = data;
        }
    })
    .catch(function (error) {
        console.error("About section loading error:", error);
    });
