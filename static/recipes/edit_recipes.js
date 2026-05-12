document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get("id");
  
  function getCookie(name) {
    const cookieValue = `; ${document.cookie}`;
    const parts = cookieValue.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(";").shift();
    }
    return "";
  }

  // Load data into the form
  if (recipeId !== null) {
    fetch(`/api/recipes/${recipeId}/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Recipe load failed");
        }
        return response.json();
      })
      .then((data) => {
        const recipe = data.recipe;
        document.getElementById("recipe_id").value = recipe.id;
        document.querySelector("input[name='recipe_name']").value = recipe.name;
        document.getElementById("course").value = recipe.course;
        document.getElementById("description").value = recipe.description;

        const tbody = document.querySelector(".ingredients-table tbody");
        tbody.innerHTML = "";

        recipe.ingredients.forEach((ing, index) => {
          const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td><input type="text" class="ing_name" value="${ing.name}" required></td>
                    <td><input type="text" class="ing_qty" value="${ing.quantity}" required></td>
                </tr>
            `;
          tbody.insertAdjacentHTML("beforeend", row);
        });
      })
      .catch(() => {
        alert("Could not load recipe. Please go back and try again.");
      });
  }

  // Save data on submit
  document.getElementById("editForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document
      .querySelector("input[name='recipe_name']")
      .value.trim();
    const course = document.getElementById("course").value;
    const desc = document.getElementById("description").value.trim();

    // Gather updated ingredients
    const ingNames = document.querySelectorAll(".ing_name");
    const ingQtys = document.querySelectorAll(".ing_qty");
    const updatedIngredients = [];

    for (let i = 0; i < ingNames.length; i++) {
      if (ingNames[i].value.trim() !== "") {
        updatedIngredients.push({
          name: ingNames[i].value.trim(),
          quantity: ingQtys[i].value.trim(),
        });
      }
    }

    if (!name || !course || !desc || updatedIngredients.length === 0) {
      alert("Please fill in all required fields and at least one ingredient.");
      return;
    }

    const updatedRecipe = {
      name: name,
      course: course,
      description: desc,
      ingredients: updatedIngredients,
    };

    try {
      const response = await fetch(`/api/recipes/${recipeId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(updatedRecipe),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || "Failed to update recipe.");
        return;
      }

      const banner = document.getElementById("submit-message");
      banner.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });

      setTimeout(() => {
        window.location.href = "manage_recipes.html";
      }, 1500);
    } catch (error) {
      alert("Network error while updating recipe.");
    }
  });
});
