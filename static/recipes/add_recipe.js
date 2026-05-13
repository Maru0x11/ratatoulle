function getCookie(name) {
    const cookieValue = `; ${document.cookie}`;
    const parts = cookieValue.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(";").shift();
    }
    return "";
}

document.addEventListener('DOMContentLoaded', () => {
    const addIngrdBtn = document.querySelector('.btn-add');

    if (addIngrdBtn) {
        addIngrdBtn.addEventListener("click", () => {
            const table = document.getElementById('ingredients-table');
            const emptyState = document.getElementById('empty-state');
            const ingrdTbody = document.getElementById('ingredients-tbody');

            if (!ingrdTbody) return;

            const trCount = ingrdTbody.querySelectorAll("tr").length + 1;

            const placeHolderIng = ['e.g. Flour', 'e.g. Salt', 'e.g. Butter', 'e.g. Eggs', 'e.g. Garlic'];
            const placeHolderQty = ['e.g. 50g', 'e.g. 2 clove', 'e.g. 1 tsp', 'e.g. 3', 'e.g 200g'];
            const randomIdx = Math.floor(Math.random() * placeHolderIng.length);

            const newRow = `
                <tr>
                    <td>${trCount}</td>
                    <td><input type="text" name="ing_name" class="ing_name" placeholder="${placeHolderIng[randomIdx]}"></td>
                    <td><input type="text" name="ing_qty" class="ing_qty" placeholder="${placeHolderQty[randomIdx]}"></td>
                </tr>
            `;
            
            ingrdTbody.insertAdjacentHTML('beforeend', newRow);

            table.classList.remove('hidden');
            emptyState.classList.add('hidden');
            
            const addMsg = document.getElementById("add-message");
            if (addMsg) addMsg.style.display = 'block';
        });
    }

    const recipeForm = document.querySelector('form');
    if (recipeForm) {
        recipeForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const inputNameData = document.querySelectorAll('.ing_name');
            const inputQtyData = document.querySelectorAll('.ing_qty');

            const hasIngredient = [...inputNameData].some(input => input.value.trim() !== '');

            if (!hasIngredient) {
                document.getElementById("error-message").style.display = 'block';
                return;
            }

            const ingredients = [...inputNameData].map((input, i) => ({
                name: input.value.trim(),
                quantity: inputQtyData[i].value.trim() || "to taste"
            })).filter(ing => ing.name !== "");

            const recipe = {
                name: document.getElementById("recipe_name").value.trim(),
                course: document.getElementById("course").value,
                description: document.getElementById("description").value.trim(),
                ingredients: ingredients
            };
            const imageInput = document.getElementById("recipe_image");
            const selectedImage = imageInput && imageInput.files ? imageInput.files[0] : null;
            const formData = new FormData();
            formData.append("recipe", JSON.stringify(recipe));
            if (selectedImage) {
                formData.append("image", selectedImage);
            }

            try {
                const response = await fetch("/api/recipes/create/", {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCookie("csrftoken"),
                    },
                    body: formData,
                });

                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    const message = data.error || "Failed to create recipe.";
                    document.getElementById("error-message").textContent = message;
                    document.getElementById("error-message").style.display = "block";
                    return;
                }

                document.getElementById("error-message").style.display = "none";
                document.getElementById("submit-message").style.display = "block";

                setTimeout(() => {
                    window.location.href = "manage_recipes.html";
                }, 1500);
            } catch (error) {
                document.getElementById("error-message").textContent = "Network error. Please try again.";
                document.getElementById("error-message").style.display = "block";
            }
        });
    }
});
