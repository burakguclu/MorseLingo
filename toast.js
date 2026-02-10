// toast.js
// Modern toast notification sistemi — alert() yerine kullanılır.

const TOAST_DURATION = 3000;

const TOAST_ICONS = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  xp: "⭐",
  info: "ℹ️",
};

let container = null;

/**
 * Toast sistemini başlatır.
 */
export function initToast() {
  container = document.getElementById("toastContainer");
}

/**
 * Toast bildirimi gösterir.
 * @param {string} message - Gösterilecek mesaj
 * @param {"success"|"error"|"warning"|"xp"|"info"} type - Toast tipi
 * @param {number} duration - Gösterim süresi (ms)
 */
export function showToast(message, type = "info", duration = TOAST_DURATION) {
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Otomatik kaldırma
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, duration);
}
