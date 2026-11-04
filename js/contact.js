/* =========================
   CONTACT / ENQUIRY FORM
   Builds a WhatsApp message and opens the chat.
========================= */

const WHATSAPP_NUMBER = "919931614860";
const CUSTOMER_KEY = "marviqueCustomer";

fetch("sections/contact.html?v=20261106")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load contact.html");
        }
        return response.text();
    })
    .then(function (data) {
        const host = document.getElementById("contact-container");

        if (!host) return;

        host.innerHTML = data;

        const form = host.querySelector("#contactForm");
        const nameInput = host.querySelector("#contactName");
        const phoneInput = host.querySelector("#contactPhone");
        const cityInput = host.querySelector("#contactCity");
        const interestInput = host.querySelector("#contactInterest");
        const messageInput = host.querySelector("#contactMessageInput");
        const status = host.querySelector("#contactStatus");

        if (!form || !status) return;

        function readSavedCustomer() {
            try {
                const saved = JSON.parse(
                    localStorage.getItem(CUSTOMER_KEY) || "{}"
                );
                return saved && typeof saved === "object" ? saved : {};
            } catch (error) {
                return {};
            }
        }

        function saveCustomer(customer) {
            try {
                localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
            } catch (error) {
                /* storage may be unavailable; the form still works */
            }
        }

        const savedCustomer = readSavedCustomer();

        if (savedCustomer.name && nameInput) {
            nameInput.value = savedCustomer.name;
        }

        if (savedCustomer.phone && phoneInput) {
            phoneInput.value = savedCustomer.phone;
        }

        function normalizePhone(value) {
            const digits = String(value || "").replace(/\D/g, "");

            if (digits.length === 10 && /^[6-9]/.test(digits)) {
                return digits;
            }

            if (digits.length === 12 && digits.indexOf("91") === 0) {
                return digits.slice(2);
            }

            if (digits.length === 11 && digits.charAt(0) === "0") {
                return digits.slice(1);
            }

            return "";
        }

        function setStatus(message, type) {
            status.textContent = message || "";
            status.className =
                "contact-status" + (type ? " contact-status--" + type : "");
        }

        function setFieldError(input, hasError) {
            const field = input.closest(".contact-field");

            input.setAttribute("aria-invalid", hasError ? "true" : "false");

            if (field) {
                field.classList.toggle("has-error", hasError);
            }
        }

        function clearStatusOnInput(input) {
            input.addEventListener("input", function () {
                setFieldError(input, false);
                setStatus("", "");
            });
        }

        [nameInput, phoneInput].forEach(function (input) {
            if (input) clearStatusOnInput(input);
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const name = String(nameInput ? nameInput.value : "").trim();
            const phone = normalizePhone(phoneInput ? phoneInput.value : "");
            const city = String(cityInput ? cityInput.value : "").trim();
            const interest = String(
                interestInput ? interestInput.value : ""
            ).trim();
            const message = String(
                messageInput ? messageInput.value : ""
            ).trim();

            let firstInvalid = null;

            const nameInvalid = name.length < 2;
            const phoneInvalid = !phone;

            if (nameInput) setFieldError(nameInput, nameInvalid);
            if (phoneInput) setFieldError(phoneInput, phoneInvalid);

            if (nameInvalid) firstInvalid = nameInput;
            else if (phoneInvalid) firstInvalid = phoneInput;

            if (firstInvalid) {
                setStatus(
                    nameInvalid
                        ? "Please enter your name."
                        : "Please enter a valid 10-digit mobile number.",
                    "error"
                );
                firstInvalid.focus();
                return;
            }

            const lines = [
                "New enquiry from the Marvique website",
                "",
                "Name: " + name,
                "Phone: +91 " + phone.slice(0, 5) + " " + phone.slice(5)
            ];

            if (city) {
                lines.push("City / area: " + city);
            }

            lines.push("Interested in: " + (interest || "General enquiry"));
            lines.push("");
            lines.push("Message:");
            lines.push(message || "No message added.");

            const url =
                "https://wa.me/" +
                WHATSAPP_NUMBER +
                "?text=" +
                encodeURIComponent(lines.join("\n"));

            saveCustomer(
                Object.assign({}, savedCustomer, {
                    name: name,
                    phone: phone
                })
            );

            setStatus("Opening WhatsApp…", "success");

            const text = document.createTextNode(
                "If WhatsApp does not open, "
            );

            const link = document.createElement("a");
            link.href = url;
            link.target = "_blank";
            link.rel = "noopener";
            link.textContent = "tap here to send your enquiry";

            status.replaceChildren(
                text,
                link,
                document.createTextNode(".")
            );
            status.className = "contact-status contact-status--success";

            window.open(url, "_blank", "noopener");
        });
    })
    .catch(function (error) {
        console.error("Contact section loading error:", error);
    });
