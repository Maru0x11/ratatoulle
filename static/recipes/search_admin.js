/* search_logic.js */
import { renderRecipesUser } from './render_recipes.js';

async function loadRecipes() {
    const response = await fetch('/api/recipes/');
    const data = await response.json();
    renderRecipesUser(data);
}
loadRecipes();

const searchForm = document.querySelector('.search-container form');

if (searchForm) {
    searchForm.addEventListener('submit', async function(e) {
        e.preventDefault(); 

        const formData = new FormData(searchForm);
        const query = formData.get('query').trim();
        const searchType = formData.get('search_type');
        const courseFilter = formData.get('course');


        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (searchType) params.append('type', searchType);
        if (courseFilter) params.append('course', courseFilter);

        const response = await fetch(`/api/recipes/?${params.toString()}`);
        const data = await response.json();
        renderRecipesUser(data);
    });
}