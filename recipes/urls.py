from django.urls import path
from django.views.generic import TemplateView
from django.views.generic.base import RedirectView
from django.views.decorators.csrf import ensure_csrf_cookie

from . import views

def csrf_template_view(template_name):
    return ensure_csrf_cookie(TemplateView.as_view(template_name=template_name))

urlpatterns = [
    path("", csrf_template_view("recipes/index.html"), name="index"),
    path("index", csrf_template_view("recipes/index.html")),
    path("search", csrf_template_view("recipes/search.html")),
    path("login", csrf_template_view("recipes/login.html")),
    path("signup", csrf_template_view("recipes/signup.html")),
    path("favorites", csrf_template_view("recipes/favorites.html")),
    path("manage_recipes", csrf_template_view("recipes/manage_recipes.html")),
    path("add_recipe", csrf_template_view("recipes/add_recipe.html")),
    path("edit_recipe", csrf_template_view("recipes/edit_recipe.html")),
    path("recipe_detail", csrf_template_view("recipes/recipe_detail.html")),
    path(
        "recipe_detail_admin",
        csrf_template_view("recipes/recipe_detail_admin.html"),
    ),
    path("index_admin", csrf_template_view("recipes/index_admin.html")),

    # Redirects
    path(
        "recipes/",
        RedirectView.as_view(url="/search.html", permanent=False),
        name="recipes_alias",
    ),
    path(
        "recipes",
        RedirectView.as_view(url="/search.html", permanent=False),
    ),
    path("api/recipes/", views.list_recipes, name="list_recipes"),
    path("api/recipes/create/", views.create_recipe, name="create_recipe"),
    path("api/recipes/<int:recipe_id>/", views.recipe_detail_api, name="recipe_detail_api"),
    path("api/favorites/", views.list_favorites, name="list_favorites"),
    path("api/favorites/<int:recipe_id>/", views.toggle_favorite, name="toggle_favorite"),

    # Auth API
    path("api/login/", views.api_login, name="api_login"),
    path("api/signup/", views.api_signup, name="api_signup"),
    path("api/logout/", views.api_logout, name="api_logout"),
    path("api/session/", views.get_session_info, name="api_session"),
]
