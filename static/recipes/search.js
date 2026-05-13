import { fetchRecipes, renderRecipesUser } from './render_recipes.js';
import './favorites.js';


// Load all recipes when the page first loads
fetchRecipes().then(renderRecipesUser);

const searchForm = document.querySelector('.search-container form');

if (searchForm) {
  searchForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(searchForm);
    const query = formData.get('query').trim();
    const search_type = formData.get('search_type');
    const course = formData.get('course');

    // Send filters to Django API
    const recipes = await fetchRecipes({ query, search_type, course });
    renderRecipesUser(recipes);
  });
}
