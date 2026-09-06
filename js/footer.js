/* =========================
   FOOTER
========================= */

fetch("sections/footer.html")
    .then(response => response.text())
    .then(data => {

        document.getElementById("footer").innerHTML = data;

        const year =
            document.getElementById("currentYear");

        if (year) {
            year.textContent = new Date().getFullYear();
        }

    })
    .catch(error => {
        console.error("Footer loading error:", error);
    });