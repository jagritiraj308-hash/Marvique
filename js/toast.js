/* =========================
   TOAST NOTIFICATIONS
========================= */

let toastTimer = null;

export function showToast(message) {
    if (!message) return;

    let toast = document.querySelector(".site-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.className = "site-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);
    }

    toast.textContent = message;

    // Restart the animation even when a toast is already visible.
    toast.classList.remove("is-visible");
    void toast.offsetWidth;
    toast.classList.add("is-visible");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(function () {
        toast.classList.remove("is-visible");
    }, 2600);
}
