document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get("id"); 

  if (recipeId) {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/`);
      if (!response.ok) throw new Error("Recipe not found");
      
      const data = await response.json();
      const recipe = data.recipe;

      if (recipe) {
        document.getElementById("recipe-name").textContent = recipe.name;
        document.getElementById("recipe-course").textContent = recipe.course;
        document.getElementById("recipe-description").textContent = recipe.description;

        const tbody = document.getElementById("recipe-ingredients");
        tbody.innerHTML = ""; 
        recipe.ingredients.forEach((ing, i) => {
          if (!ing.name.trim()) return; 
          const row = tbody.insertRow();
          row.insertCell().textContent = i + 1;
          row.insertCell().textContent = ing.name;
          row.insertCell().textContent = ing.quantity;
        });

        // Setup Favorites Form logic
        const favForm = document.getElementById("add-fav-form");
        if (favForm) {
          favForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
            if (favorites.some((f) => f.id === recipe.id)) {  // now checks by id
              alert("This recipe is already in your favorites!");
            } else {
              favorites.push(recipe);
              localStorage.setItem("favorites", JSON.stringify(favorites));
              alert("Added to Favorites!");
            }
          });
        }
      }
    } catch (error) {
      document.querySelector(".recipe-detail-main").innerHTML =
        "<h1>Recipe not found</h1><a href='search.html'>Back to Browse</a>";
    }
  }
});