import { fetchRecipes, renderRecipes } from './render_recipes.js';

// Load and display all recipes when the page first loads
fetchRecipes().then(renderRecipes);

const searchForm = document.querySelector('.search-container form');

if (searchForm) {
  searchForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(searchForm);
    const query = formData.get('query').trim();
    const search_type = formData.get('search_type');
    const course = formData.get('course');

    // Send filters to Django API
    const recipes = await fetchRecipes({ query, search_type, course });
    renderRecipes(recipes);
  });
}