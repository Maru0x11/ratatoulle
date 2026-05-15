document.addEventListener("DOMContentLoaded", () => {
  const id = parseInt(new URLSearchParams(window.location.search).get("id"), 10);
  if (Number.isNaN(id)) {
    document.querySelector(".recipe-detail-main").innerHTML =
      "<h1>Recipe not found</h1><a href='manage_recipes.html'>Back to Manage</a>";
    return;
  }

  fetch(`/api/recipes/${id}/`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Recipe not found");
      }
      return response.json();
    })
    .then((data) => {
      const recipe = data.recipe;
      document.getElementById("detail-name").textContent = recipe.name;
      const recipeImage = document.getElementById("detail-image");
      if (recipeImage) {
        if (recipe.image_url) {
          recipeImage.src = recipe.image_url;
          recipeImage.alt = `${recipe.name} image`;
          recipeImage.style.display = "block";
        } else {
          recipeImage.style.display = "none";
        }
      }
      document.getElementById("detail-course").textContent = recipe.course;
      document.getElementById("detail-description").textContent = recipe.description;

      const tbody = document.getElementById("detail-ingredients");
      tbody.innerHTML = "";
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach((ing, i) => {
          const name = (ing.name || "").trim();
          if (!name) return;
          const row = tbody.insertRow();
          row.insertCell().textContent = i + 1;
          row.insertCell().textContent = name;
          row.insertCell().textContent = ing.quantity || "";
        });
      }
    })
    .catch(() => {
      document.querySelector(".recipe-detail-main").innerHTML =
        "<h1>Recipe not found</h1><a href='manage_recipes.html'>Back to Manage</a>";
    });
});
