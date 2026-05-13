import json

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from .models import Ingredient, Recipe


def _json_error(message, status=400):
    return JsonResponse({"error": message}, status=status)


def _is_admin_user(user):
    return user.is_authenticated and (user.is_admin or user.is_staff or user.is_superuser)


def _validate_recipe_payload(payload):
    title = str(payload.get("name", "")).strip()
    course = str(payload.get("course", "")).strip().lower()
    description = str(payload.get("description", "")).strip()
    ingredients_data = payload.get("ingredients", [])

    if not title:
        return None, "Recipe name is required."
    if not description:
        return None, "Description is required."
    if not course:
        return None, "Course is required."

    course_map = {
        "appetizers": Recipe.CourseType.APPETIZERS,
        "main course": Recipe.CourseType.MAIN_COURSE,
        "main_course": Recipe.CourseType.MAIN_COURSE,
        "dessert": Recipe.CourseType.DESSERT,
    }
    normalized_course = course_map.get(course)
    if not normalized_course:
        return None, "Invalid course value."

    if not isinstance(ingredients_data, list) or len(ingredients_data) == 0:
        return None, "At least one ingredient is required."

    normalized_ingredients = []
    for ingredient in ingredients_data:
        name = str(ingredient.get("name", "")).strip()
        quantity = str(ingredient.get("quantity", "")).strip() or "to taste"
        if name:
            normalized_ingredients.append({"name": name, "quantity": quantity})

    if len(normalized_ingredients) == 0:
        return None, "At least one valid ingredient is required."

    return {
        "title": title,
        "description": description,
        "recipe_type": normalized_course,
        "ingredients": normalized_ingredients,
    }, None


def _serialize_recipe(recipe):
    course_map = {
        Recipe.CourseType.APPETIZERS: "appetizers",
        Recipe.CourseType.MAIN_COURSE: "main course",
        Recipe.CourseType.DESSERT: "dessert",
    }
    return {
        "id": recipe.id,
        "name": recipe.title,
        "course": course_map.get(recipe.recipe_type, recipe.recipe_type),
        "description": recipe.description,
        "ingredients": [
            {"name": ingredient.name, "quantity": ingredient.quantity}
            for ingredient in recipe.ingredients.all()
        ],
    }

@require_http_methods(["GET"])
def list_recipes(request):
    queryset = Recipe.objects.prefetch_related("ingredients").all()

    course = request.GET.get("course", "").strip().lower()
    course_map = {
        "appetizers": Recipe.CourseType.APPETIZERS,
        "main course": Recipe.CourseType.MAIN_COURSE,
        "main_course": Recipe.CourseType.MAIN_COURSE,
        "dessert": Recipe.CourseType.DESSERT,
    }
    if course and course in course_map:
        queryset = queryset.filter(recipe_type=course_map[course])

    query = request.GET.get("query", "").strip()
    search_type = request.GET.get("search_type", "name")

    if query:
        if search_type == "ingredient":
            # Filter recipes that have an ingredient whose name contains the query
            queryset = queryset.filter(ingredients__name__icontains=query).distinct()
        else:
            # Default: search by recipe title/name
            queryset = queryset.filter(title__icontains=query)

    recipes = [_serialize_recipe(r) for r in queryset]
    return JsonResponse({"recipes": recipes})

@require_http_methods(["POST"])
def create_recipe(request):
    if not _is_admin_user(request.user):
        return _json_error("Admin access required.", status=403)

    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return _json_error("Invalid JSON payload.")

    cleaned_data, error = _validate_recipe_payload(payload)
    if error:
        return _json_error(error)

    recipe = Recipe.objects.create(
        title=cleaned_data["title"],
        description=cleaned_data["description"],
        recipe_type=cleaned_data["recipe_type"],
        author=request.user,
    )

    for ingredient_data in cleaned_data["ingredients"]:
        ingredient = Ingredient.objects.create(
            name=ingredient_data["name"],
            quantity=ingredient_data["quantity"],
        )
        recipe.ingredients.add(ingredient)

    return JsonResponse(
        {"message": "Recipe created successfully.", "recipe": _serialize_recipe(recipe)},
        status=201,
    )


@require_http_methods(["GET", "PUT", "DELETE"])
def recipe_detail_api(request, recipe_id):
    if not _is_admin_user(request.user):
        return _json_error("Admin access required.", status=403)

    recipe = Recipe.objects.filter(id=recipe_id).prefetch_related("ingredients").first()
    if not recipe:
        return _json_error("Recipe not found.", status=404)

    if request.method == "GET":
        return JsonResponse({"recipe": _serialize_recipe(recipe)})

    if request.method == "DELETE":
        recipe.delete()
        return JsonResponse({"message": "Recipe deleted successfully."})

    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return _json_error("Invalid JSON payload.")

    cleaned_data, error = _validate_recipe_payload(payload)
    if error:
        return _json_error(error)

    recipe.title = cleaned_data["title"]
    recipe.description = cleaned_data["description"]
    recipe.recipe_type = cleaned_data["recipe_type"]
    recipe.save()

    recipe.ingredients.all().delete()
    recipe.ingredients.clear()
    for ingredient_data in cleaned_data["ingredients"]:
        ingredient = Ingredient.objects.create(
            name=ingredient_data["name"],
            quantity=ingredient_data["quantity"],
        )
        recipe.ingredients.add(ingredient)

    return JsonResponse({"message": "Recipe updated successfully.", "recipe": _serialize_recipe(recipe)})
