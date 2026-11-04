/* =========================
   GALLERY
========================= */

fetch("sections/gallery.html?v=20261106")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load gallery.html");
        }
        return response.text();
    })
    .then(function (data) {
        const host = document.getElementById("gallery-container");

        if (!host) return;

        host.innerHTML = data;

        const galleryItems = host.querySelectorAll(".gallery-item");

        galleryItems.forEach(function (item) {
            item.addEventListener("click", function () {
                galleryItems.forEach(function (gallery) {
                    gallery.classList.remove("selected");
                });

                item.classList.add("selected");
            });
        });
    })
    .catch(function (error) {
        console.error("Gallery loading error:", error);
    });
