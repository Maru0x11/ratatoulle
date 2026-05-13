import { getCsrfToken } from "./auth.js";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function ensureStatusElement() {
  let status = document.getElementById("favorites-status");
  if (status) return status;

  const main = document.querySelector(".favorites-main") || document.querySelector("main");
  if (!main) return null;

  status = document.createElement("div");
  status.id = "favorites-status";
  status.className = "inline-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const table = main.querySelector(".favorites-table");
  if (table) {
    main.insertBefore(status, table);
  } else {
    main.insertBefore(status, main.firstChild);
  }
  return status;
}

function setStatus(message, type = "info") {
  const status = ensureStatusElement();
  if (!status) return;

  status.textContent = message;
  status.dataset.type = type;
  status.hidden = !message;
}

function updateFavoriteButtons(recipeId) {
  document
    .querySelectorAll(`.btn-fav[data-id="${recipeId}"]`)
    .forEach((button) => {
      button.disabled = true;
      button.textContent = "In Favourites";
      button.classList.add("is-favorite");
    });
}

async function fetchFavorites() {
  const response = await fetch("/api/favorites/");
  if (response.status === 401) {
    throw new Error("401");
  }
  if (!response.ok) {
    throw new Error(`Failed to load favorites (${response.status}).`);
  }
  const data = await response.json();
  return data.recipes || [];
}

async function renderFavorites() {
  const container = document.getElementById("favorites-list");
  if (!container) return;

  try {
    const favorites = await fetchFavorites();
    if (favorites.length === 0) {
      setStatus("Your favorites list is empty.", "info");
      container.innerHTML =
        '<tr><td colspan="7" style="text-align:center; padding: 20px;">Your favorites list is empty.</td></tr>';
      return;
    }

    setStatus(`Loaded ${favorites.length} favorite recipe${favorites.length === 1 ? "" : "s"}.`, "success");
    container.innerHTML = "";
    favorites.forEach((recipe, index) => {
      const tr = document.createElement("tr");
      const ingredientsHTML = recipe.ingredients
        .filter((ing) => ing.name.trim() !== "")
        .map((ing) => `<li>${escapeHtml(ing.name)} (${escapeHtml(ing.quantity)})</li>`)
        .join("");

      const imageCell = recipe.image_url
        ? `<img src="${escapeHtml(recipe.image_url)}" alt="${escapeHtml(recipe.name)}" class="favorites-thumb">`
        : "No image";
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${imageCell}</td>
        <td><strong>${escapeHtml(recipe.name)}</strong></td>
        <td>${escapeHtml(recipe.course)}</td>
        <td>${escapeHtml(recipe.description)}</td>
        <td><ul>${ingredientsHTML}</ul></td>
        <td><button type="button" class="btn-remove" data-id="${recipe.id}">Remove</button></td>
      `;
      container.appendChild(tr);
    });
  } catch (error) {
    if (error && /401/.test(String(error.message))) {
      setStatus("Please log in to view favorites.", "error");
      container.innerHTML =
        '<tr><td colspan="7" style="text-align:center; padding: 20px;">Please log in to view favorites.</td></tr>';
      return;
    }
    setStatus("Could not load favorites.", "error");
    container.innerHTML =
      '<tr><td colspan="7" style="text-align:center; padding: 20px;">Could not load favorites.</td></tr>';
  }
}

window.addToFavorites = async function(recipeId) {
  try {
    const response = await fetch(`/api/favorites/${recipeId}/`, {
      method: "POST",
      headers: {
        "X-CSRFToken": getCsrfToken(),
      },
    });
    if (response.status === 409) {
      setStatus("This recipe is already in your favorites.", "error");
      return;
    }
    if (response.status === 401) {
      setStatus("Please log in first.", "error");
      window.location.href = "/login.html";
      return;
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setStatus(data.error || "Failed to add favorite.", "error");
      return;
    }
    setStatus("Added to favorites.", "success");
    updateFavoriteButtons(recipeId);
    if (document.getElementById("favorites-list")) {
      await renderFavorites();
    }
  } catch (error) {
    setStatus("Network error while adding favorite.", "error");
  }
};

async function removeFavorite(recipeId) {
  const response = await fetch(`/api/favorites/${recipeId}/`, {
    method: "DELETE",
    headers: {
      "X-CSRFToken": getCsrfToken(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    setStatus(data.error || "Failed to remove favorite.", "error");
    return;
  }

  setStatus("Removed from favorites.", "success");
  await renderFavorites();
  document
    .querySelectorAll(`.btn-fav[data-id="${recipeId}"]`)
    .forEach((button) => {
      button.disabled = false;
      button.textContent = "Add to Favourites";
      button.classList.remove("is-favorite");
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("favorites-list");
  if (!container) return;

  renderFavorites();
  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-remove")) {
      const recipeId = parseInt(e.target.getAttribute("data-id"), 10);
      if (!Number.isNaN(recipeId)) {
        removeFavorite(recipeId);
      }
    }
  });
});

