/**
 * Utility functions for authentication and session management.
 */

export function getCsrfToken() {
  const name = "csrftoken";
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export async function handleLogout() {
  try {
    const response = await fetch("/api/logout/", {
      method: "POST",
      headers: {
        "X-CSRFToken": getCsrfToken(),
      },
    });
    if (response.ok) {
      window.location.href = "/login.html";
    } else {
      console.error("Logout failed");
    }
  } catch (err) {
    console.error("Logout error:", err);
  }
}

export async function checkSession() {
  try {
    const response = await fetch("/api/session/");
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error("Failed to check session:", err);
  }
  return { authenticated: false };
}
