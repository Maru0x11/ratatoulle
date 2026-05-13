/**
 * Escapes special HTML characters to prevent XSS and broken markup.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderRecipeImage(imageUrl, recipeName) {
  if (!imageUrl) return "";
  return `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(recipeName)}" class="recipe-card-image">`;
}

function renderFavoriteButton(recipe) {
  const isFavorite = Boolean(recipe.is_favorite);
  const label = isFavorite ? "In Favourites" : "Add to Favourites";
  const disabled = isFavorite ? "disabled" : "";
  const extraClass = isFavorite ? " is-favorite" : "";
  return `<button type="button" class="btn-fav${extraClass}" data-id="${recipe.id}" ${disabled}>${label}</button>`;
}

/**
 * Fetches recipes from the Django API with optional filters.
 * Sends query params: query, search_type, course
 * Returns an array of recipe objects, or [] on error.
 */

export async function fetchRecipes(params = {}) {
  // Build query string from the params object (skip empty values)
  const queryString = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ""))
  ).toString();

  const url = `/api/recipes/${queryString ? "?" + queryString : ""}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("API error:", response.status);
      return [];
    }
    const data = await response.json();
    return data.recipes || [];
  } catch (err) {
    console.error("Failed to fetch recipes:", err);
    return [];
  }
}

/**
 * Admin version, includes Edit and Delete buttons.
 * Used on manage_recipes.html
 */
export function renderRecipes(recipes = []) {
  if (typeof ensureDeleteModal === "function") {
    ensureDeleteModal();
  }

  const container = document.getElementById("recipesList");
  if (!container) return;

  container.innerHTML = "";
  if (recipes.length === 0) {
    container.innerHTML = "<p>No recipes found.</p>";
    return;
  }

  recipes.forEach((recipe, index) => {
    const id = recipe.id ?? index;
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      ${renderRecipeImage(recipe.image_url, recipe.name)}
      <h3>Recipe Name: ${escapeHtml(recipe.name)}</h3>
      <p>Course: ${escapeHtml(recipe.course)}</p>
      <p>${escapeHtml(recipe.description)}</p>
      <div>
        <a href="recipe_detail_admin.html?id=${id}" class="btn-card">View Details</a>
        <a href="edit_recipe.html?id=${id}" class="btn-card">Edit Recipe</a>
        <button type="button" class="btn-delete" data-index="${id}">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

/**
 * User Version: No edit/delete buttons.
 * Used on search.html (Browse page)
 */
export function renderRecipesUser(recipes = []) {
  const container = document.getElementById("recipesList");
  if (!container) return;

  container.innerHTML = "";
  if (recipes.length === 0) {
    container.innerHTML = "<p>No recipes found.</p>";
    return;
  }

  recipes.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      ${renderRecipeImage(recipe.image_url, recipe.name)}
      <h3>Recipe Name: ${escapeHtml(recipe.name)}</h3>
      <p>Course: ${escapeHtml(recipe.course)}</p>
      <p>${escapeHtml(recipe.description)}</p>
      <a href="recipe_detail.html?id=${recipe.id}" class="btn-card">View Details</a>
      ${renderFavoriteButton(recipe)}
    `;
    container.appendChild(card);
  });

  if (!container.dataset.favoritesBound) {
    container.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-fav") && typeof window.addToFavorites === "function") {
        window.addToFavorites(e.target.dataset.id);
      }
    });
    container.dataset.favoritesBound = "1";
  }
}
