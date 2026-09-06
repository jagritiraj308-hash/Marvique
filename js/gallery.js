/* =========================
   GALLERY
========================= */

fetch("sections/gallery.html")
    .then(response => response.text())
    .then(data => {

        document.getElementById("gallery").innerHTML = data;

        const galleryItems =
            document.querySelectorAll(".gallery-item");

        galleryItems.forEach(function (item) {

            item.addEventListener("click", function () {

                galleryItems.forEach(function (gallery) {
                    gallery.classList.remove("selected");
                });

                item.classList.add("selected");

            });

        });

    })
    .catch(error => {
        console.error("Gallery loading error:", error);
    });