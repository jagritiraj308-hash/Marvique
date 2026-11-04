/* =========================
   HEADER
========================= */

fetch("sections/header.html?v=20261107")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load header.html");
        }
        return response.text();
    })
    .then(function (data) {
        const host = document.getElementById("header");

        if (!host) return;

        host.innerHTML = data;

        const menuButton = host.querySelector("#menuBtn");
        const navbar = host.querySelector("#navbar");
        const header = host.querySelector(".header");

        if (!menuButton || !navbar) return;

        function setMenu(open) {
            navbar.classList.toggle("show", open);

            menuButton.setAttribute("aria-expanded", open ? "true" : "false");
            menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
            menuButton.textContent = open ? "✕" : "☰";

            document.body.classList.toggle("menu-open", open);
        }

        menuButton.addEventListener("click", function () {
            setMenu(!navbar.classList.contains("show"));
        });

        navbar.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                setMenu(false);
            });
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                setMenu(false);
            }
        });

        document.addEventListener("click", function (event) {
            if (!navbar.classList.contains("show")) return;

            if (
                !navbar.contains(event.target) &&
                !menuButton.contains(event.target)
            ) {
                setMenu(false);
            }
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth > 1024) {
                setMenu(false);
            }
        });

        /* Wishlist count */

        function updateWishlistCount() {
            const countElement = document.getElementById("wishlistCount");

            if (!countElement) return;

            try {
                const saved = JSON.parse(
                    localStorage.getItem("marviqueWishlist") || "[]"
                );

                countElement.textContent = Array.isArray(saved)
                    ? saved.length
                    : 0;
            } catch (error) {
                countElement.textContent = "0";
            }
        }

        updateWishlistCount();

        window.addEventListener("storage", updateWishlistCount);
        window.addEventListener("marvique:wishlistchange", updateWishlistCount);

        /* Sticky header + active section */

        function updateHeader() {
            if (header) {
                header.classList.toggle("scrolled", window.scrollY > 20);
            }

            const links = Array.from(
                navbar.querySelectorAll('a[href^="#"]')
            );

            let current = "";

            links.forEach(function (link) {
                const id = link.getAttribute("href").slice(1);

                if (!id) return;

                const section = document.getElementById(id);

                if (section && section.getBoundingClientRect().top <= 130) {
                    current = id;
                }
            });

            links.forEach(function (link) {
                link.classList.toggle(
                    "active",
                    current !== "" &&
                        link.getAttribute("href") === "#" + current
                );
            });
        }

        window.addEventListener("scroll", updateHeader, { passive: true });
        updateHeader();
    })
    .catch(function (error) {
        console.error("Header loading error:", error);
    });
