import { renderRecipes } from "./render_recipes.js";

function getCookie(name) {
  const cookieValue = `; ${document.cookie}`;
  const parts = cookieValue.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }
  return "";
}

// Listen for the Delete button on the Manage Recipes list
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("btn-delete")) {
    e.preventDefault();
    const index = parseInt(e.target.getAttribute("data-index"));
    executeDelete(index, false);
  }
});

// Listen for the Delete button on the Admin Detail page
document.addEventListener("submit", function (e) {
  if (e.target.classList.contains("delete-recipe-form")) {
    e.preventDefault();
    const index = parseInt(e.target.querySelector(".recipe_id").value);
    executeDelete(index, true);
  }
});

// The actual delete logic
function executeDelete(index, redirect) {
  if (isNaN(index)) return;

  // CRITICAL FIX: Ensure the HTML for the modal actually exists before trying to open it!
  if (typeof ensureDeleteModal === "function") {
    ensureDeleteModal();
  }

  const recipeCard = document.querySelector(`[data-index="${index}"]`)?.closest(".recipe-card");
  const recipeName = recipeCard?.querySelector("h3")?.textContent?.replace("Recipe Name: ", "") || "this recipe";

  openDeleteModal(recipeName, async function () {
    try {
      const response = await fetch(`/api/recipes/${index}/`, {
        method: "DELETE",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || "Failed to delete recipe.");
        return;
      }

      if (redirect) {
        window.location.href = "manage_recipes.html";
      } else {
        renderRecipes(); // Refresh the list automatically
      }
    } catch (error) {
      alert("Network error while deleting recipe.");
    }
  });
}
