import { getCsrfToken } from "./auth.js";

async function fetchFavorites() {
  const response = await fetch("/api/favorites/");
  if (!response.ok) {
    throw new Error("Failed to load favorites.");
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
      container.innerHTML =
        '<tr><td colspan="6" style="text-align:center; padding: 20px;">Your favorites list is empty.</td></tr>';
      return;
    }

    container.innerHTML = "";
    favorites.forEach((recipe, index) => {
      const tr = document.createElement("tr");
      const ingredientsHTML = recipe.ingredients
        .filter((ing) => ing.name.trim() !== "")
        .map((ing) => `<li>${ing.name} (${ing.quantity})</li>`)
        .join("");

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${recipe.name}</strong></td>
        <td>${recipe.course}</td>
        <td>${recipe.description}</td>
        <td><ul>${ingredientsHTML}</ul></td>
        <td><button type="button" class="btn-remove" data-id="${recipe.id}">Remove</button></td>
      `;
      container.appendChild(tr);
    });
  } catch (error) {
    container.innerHTML =
      '<tr><td colspan="6" style="text-align:center; padding: 20px;">Could not load favorites.</td></tr>';
  }
}

window.addToFavorites = async function (recipeId) {
  try {
    const response = await fetch(`/api/favorites/${recipeId}/`, {
      method: "POST",
      headers: {
        "X-CSRFToken": getCsrfToken(),
      },
    });
    if (response.status === 409) {
      alert("This recipe is already in your favorites!");
      return;
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      alert(data.error || "Failed to add favorite.");
      return;
    }
    alert("Added to Favorites!");
  } catch (error) {
    alert("Network error while adding favorite.");
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
    alert(data.error || "Failed to remove favorite.");
    return;
  }

  await renderFavorites();
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
