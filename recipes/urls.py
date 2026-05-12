from django.urls import path

from . import views

urlpatterns = [
    path("api/recipes/create/", views.create_recipe, name="create_recipe"),
    path("api/recipes/<int:recipe_id>/", views.recipe_detail_api, name="recipe_detail_api"),
]
