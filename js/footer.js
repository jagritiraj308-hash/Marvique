/* =========================
   FOOTER
========================= */

fetch("sections/footer.html?v=20261108")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load footer.html");
        }
        return response.text();
    })
    .then(function (data) {
        const host = document.getElementById("footer");

        if (!host) return;

        host.innerHTML = data;

        const year = host.querySelector("#currentYear");

        if (year) {
            year.textContent = new Date().getFullYear();
        }
    })
    .catch(function (error) {
        console.error("Footer loading error:", error);
    });
