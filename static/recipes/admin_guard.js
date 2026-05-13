import { checkSession } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const session = await checkSession();
  if (!session.authenticated) {
    window.location.href = "/login.html";
  }
});

