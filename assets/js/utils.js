/**
 * utils.js
 * -----------------------------------------------------------------------
 * Small, dependency-free helper functions shared across pages.
 * -----------------------------------------------------------------------
 */

const Utils = {
  /** Escapes text before inserting into innerHTML, to avoid injecting markup. */
  escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  },

  /** Shows a toast-style dialog. type: "success" | "error" | "info" */
  showDialog(message, type = "info") {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.setAttribute("role", "status");
    toast.innerHTML = `
      <span class="toast__icon">${type === "success" ? "✓" : type === "error" ? "!" : "•"}</span>
      <span class="toast__message">${this.escapeHTML(message)}</span>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("toast--visible"));
    setTimeout(() => {
      toast.classList.remove("toast--visible");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  /** Simple confirm dialog. Returns a Promise<boolean>. */
  confirmDialog(title, message, confirmLabel = "Confirm") {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <h3 id="modal-title">${this.escapeHTML(title)}</h3>
          <p>${this.escapeHTML(message)}</p>
          <div class="modal__actions">
            <button type="button" class="btn btn--ghost" data-action="cancel">Go back</button>
            <button type="button" class="btn btn--primary" data-action="confirm">${this.escapeHTML(confirmLabel)}</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add("modal-overlay--visible"));

      const close = (result) => {
        overlay.classList.remove("modal-overlay--visible");
        setTimeout(() => overlay.remove(), 200);
        resolve(result);
      };

      overlay.querySelector('[data-action="cancel"]').addEventListener("click", () => close(false));
      overlay.querySelector('[data-action="confirm"]').addEventListener("click", () => close(true));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close(false);
      });
    });
  },

  /** Toggles a full-page loading indicator on/off. */
  setLoading(isLoading, message = "Loading...") {
    let el = document.querySelector(".page-loader");
    if (isLoading) {
      if (!el) {
        el = document.createElement("div");
        el.className = "page-loader";
        document.body.appendChild(el);
      }
      el.innerHTML = `<div class="page-loader__spinner"></div><p>${this.escapeHTML(message)}</p>`;
      el.classList.add("page-loader--visible");
    } else if (el) {
      el.classList.remove("page-loader--visible");
    }
  },

  /** Animates a number counting up, used for dashboard stat cards. */
  animateCount(el, targetValue, duration = 700) {
    const start = Number(el.dataset.value || 0);
    const startTime = performance.now();
    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Math.round(start + (targetValue - start) * progress);
      el.textContent = value.toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
      else el.dataset.value = targetValue;
    }
    requestAnimationFrame(step);
  },

  groupBy(array, keyFn) {
    return array.reduce((acc, item) => {
      const key = keyFn(item);
      (acc[key] = acc[key] || []).push(item);
      return acc;
    }, {});
  },
};
