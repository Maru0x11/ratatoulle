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
      recipe.ingredients.forEach((ing, i) => {
        if (!ing.name.trim()) return;
        tbody.innerHTML += `<tr><td>${i + 1}</td><td>${ing.name}</td><td>${ing.quantity}</td></tr>`;
      });
    })
    .catch(() => {
      document.querySelector(".recipe-detail-main").innerHTML =
        "<h1>Recipe not found</h1><a href='manage_recipes.html'>Back to Manage</a>";
    });
});
