document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('favorites-list');
    
    if (container) {
        renderFavorites();

        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove')) {
                const index = parseInt(e.target.getAttribute('data-index'), 10);
                removeFavorite(index);
            }
        });
    }
});

	function renderFavorites() {
    const container = document.getElementById('favorites-list');
    if (!container) return;


    if (favorites.length === 0) {
        container.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Your favorites list is empty.</td></tr>';
        return;
    }

    container.innerHTML = '';

    favorites.forEach((recipe, index) => {
        const tr = document.createElement('tr');
        
        const ingredientsHTML = recipe.ingredients
            .filter(ing => ing.name.trim() !== "")
            .map(ing => `<li>${ing.name} (${ing.quantity})</li>`)
            .join('');

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${recipe.name}</strong></td>
            <td>${recipe.course}</td>
            <td>${recipe.description}</td>
            <td><ul>${ingredientsHTML}</ul></td>
            <td>
                <button type="button" class="btn-remove" data-index="${index}">Remove</button>
            </td>
        `;
        container.appendChild(tr);
    });
}

/**
 * Global function attached to window so it can be called from search results.
 * Finds the recipe by name to ensure the correct item is added even after filtering.
 */
window.addToFavorites = function(recipeId) {
    console.log(`Adding ID ${recipeId} to favorites list`);
    const recipesArr = JSON.parse(localStorage.getItem('recipesArr') || '[]');
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    // Filter out any null/invalid entries
    favorites = favorites.filter(fav => fav !== null && fav !== undefined);

    const selectedRecipe = recipesArr.find(r => r.name === recipeId);

    if (!selectedRecipe) {
        console.error("Recipe not found:", recipeName);
        return;
    }

    if (favorites.some(fav => fav.name === selectedRecipe.name)) {
        alert("This recipe is already in your favorites!");
    } else {
        favorites.push(selectedRecipe);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        alert(`${selectedRecipe.name} added to favorites!`);
    }
};

function removeFavorite(index) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    favorites = favorites.filter(fav => fav !== null && fav !== undefined);
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites(); 
}