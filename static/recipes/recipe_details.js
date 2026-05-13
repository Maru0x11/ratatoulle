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
          favForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            try {
              const response = await fetch(`/api/favorites/${recipe.id}/`, {
                method: "POST",
                headers: {
                  "X-CSRFToken": getCookie("csrftoken"),
                },
              });
              if (response.status === 409) {
                alert("This recipe is already in your favorites!");
                return;
              }
              if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                alert(data.error || "Failed to add to favorites.");
                return;
              }
              alert("Added to Favorites!");
            } catch (favError) {
              alert("Network error while adding favorite.");
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

function getCookie(name) {
  const cookieValue = `; ${document.cookie}`;
  const parts = cookieValue.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }
  return "";
}
