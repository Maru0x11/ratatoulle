/* search_logic.js */
import { renderRecipesUser } from './render_recipes.js';

/**
 * Loads recipes from the server. Applies filters if parameters are provided.
 */
async function loadRecipes(params = "") {
    try {
        const response = await fetch(`/api/recipes/${params}`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        renderRecipesUser(data); // Use renderRecipes for search_admin.js
    } catch (err) {
        console.error("Failed to fetch recipes:", err);
    }
}

loadRecipes();

const searchForm = document.querySelector('.search-container form');

if (searchForm) {
    searchForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // get parameters from the form
        const formData = new FormData(searchForm);
        const query = formData.get('query').toLowerCase().trim();
        const searchType = formData.get('search_type');
        const courseFilter = formData.get('course').toLowerCase();
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (searchType) params.append('type', searchType);
        if (courseFilter) params.append('course', courseFilter);

        try {
            const response = await fetch(`/api/recipes/?${params.toString()}`);
            const data = await response.json();
            renderRecipesUser(data);
        } catch (err) {
            console.error("Search failed:", err);
        }
    });
}