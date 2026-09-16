/**
 * Standalone toast utility — works outside React components.
 * Dispatches custom events that the ToastProvider listens to.
 */

let toastId = 0;

function dispatchToast(message, type = "success", duration = 4000) {
  const id = ++toastId;
  window.dispatchEvent(
    new CustomEvent("zintellect:toast", {
      detail: { id, message, type, duration },
    })
  );
  return id;
}

export const toast = {
  success: (message, duration) => dispatchToast(message, "success", duration),
  error: (message, duration) => dispatchToast(message, "error", duration),
  warning: (message, duration) => dispatchToast(message, "warning", duration),
  info: (message, duration) => dispatchToast(message, "info", duration),
};

/**
 * Convert a technical error into a user-friendly message.
 */
export function friendlyMessage(error) {
  if (!error) return "Something went wrong. Please try again.";

  // Network / connection errors
  if (!error.response && error.message) {
    const msg = error.message.toLowerCase();
    if (msg.includes("network") || msg.includes("failed to fetch"))
      return "Unable to connect to the server. Please check your connection and try again.";
    if (msg.includes("timeout"))
      return "The request timed out. Please try again.";
    if (msg.includes("econnrefused") || msg.includes("connection refused"))
      return "The service is temporarily unavailable. Please try again in a moment.";
    return "Unable to connect to the server. Please check your connection and try again.";
  }

  const status = error.response?.status;
  const detail = error.response?.data?.detail || error.response?.data?.message;

  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You don't have permission to perform this action.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 422) {
    if (Array.isArray(detail)) {
      const fieldErrors = detail.map((e) => e.msg).filter(Boolean);
      return fieldErrors.length ? fieldErrors[0] : "Please check your input and try again.";
    }
    return typeof detail === "string" ? detail : "Please check your input and try again.";
  }
  if (status === 500) return "Something went wrong on our end. Please try again.";
  if (status === 502 || status === 503)
    return "The service is temporarily unavailable. Please try again in a moment.";

  if (typeof detail === "string" && detail) return detail;

  return "Something went wrong. Please try again.";
}
