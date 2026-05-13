import { fetchRecipes, renderRecipes } from './render_recipes.js';
import './delete_recipe.js';

// Fetch from API then render
fetchRecipes().then(renderRecipes);
