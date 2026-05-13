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

/**
 * Admin version, includes Edit and Delete buttons.
 * Used on manage_recipes.html
 */
export function renderRecipes(data = null) {
  if (typeof ensureDeleteModal === "function") {
    ensureDeleteModal();
  }

  const container = document.getElementById("recipesList");
  if (!container) return;

  container.innerHTML = "";
  const recipesToShow =
	data || []

  if (recipesToShow.length === 0) {
    container.innerHTML = "<p>No recipes found.</p>";
    return;
  }

  recipesToShow.forEach((recipe, index) => {
    const id = recipe.id
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
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
export function renderRecipesUser(data = null) {
  const container = document.getElementById("recipesList");
  if (!container) return;

  container.innerHTML = "";
  const recipesToShow =
    data || []

  if (recipesToShow.length === 0) {
    container.innerHTML = "<p>No recipes found.</p>";
    return;
  }

  recipesToShow.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <h3>Recipe Name: ${escapeHtml(recipe.name)}</h3>
      <p>Course: ${escapeHtml(recipe.course)}</p>
      <p>${escapeHtml(recipe.description)}</p>
      <a href="recipe_detail.html?id=${recipe.id}" class="btn-card">View Details</a>
      <button type="button" class="btn-fav" data-id="${recipe.id}">Add to Favourites</button>
    `;
    container.appendChild(card);
  });

  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-fav")) {
	window.addToFavorites(e.target.dataset.id);
    }
  });
}
