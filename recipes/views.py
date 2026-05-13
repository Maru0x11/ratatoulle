import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import Favourite, Ingredient, Recipe, User


def _json_error(message, status=400):
    return JsonResponse({"error": message}, status=status)


def _is_admin_user(user):
    return user.is_authenticated and (user.is_admin or user.is_staff or user.is_superuser)


def _require_authenticated(request):
    if not request.user.is_authenticated:
        return _json_error("Authentication required.", status=401)
    return None


def _favorite_recipe_ids(user):
    if not user or not user.is_authenticated:
        return set()
    return set(
        Favourite.objects.filter(user=user).values_list("recipes__id", flat=True)
    )


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


def _serialize_recipe(recipe, favorite_ids=None):
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
        "image_url": recipe.image.url if recipe.image else None,
        "is_favorite": recipe.id in (favorite_ids or set()),
        "ingredients": [
            {"name": ingredient.name, "quantity": ingredient.quantity}
            for ingredient in recipe.ingredients.all()
        ],
    }

@require_http_methods(["GET"])
def list_recipes(request):
    """
    Retrieves a list of recipes with optional filtering by query, search_type, and course.
    """
    query = request.GET.get("query", "").strip()
    search_type = request.GET.get("search_type", "name")
    course_filter = request.GET.get("course", "").strip().lower()
    course_map = {
        "appetizers": Recipe.CourseType.APPETIZERS,
        "main course": Recipe.CourseType.MAIN_COURSE,
        "main_course": Recipe.CourseType.MAIN_COURSE,
        "dessert": Recipe.CourseType.DESSERT,
    }

    queryset = Recipe.objects.all().prefetch_related("ingredients")

    if course_filter and course_filter in course_map:
        queryset = queryset.filter(recipe_type=course_map[course_filter])

    if query:
        if search_type == "name":
            queryset = queryset.filter(title__icontains=query)
        elif search_type == "ingredient":
            queryset = queryset.filter(ingredients__name__icontains=query).distinct()

    favorite_ids = _favorite_recipe_ids(request.user)
    queryset = queryset.prefetch_related("ingredients")
    recipes = [_serialize_recipe(r, favorite_ids) for r in queryset]
    return JsonResponse({"recipes": recipes})

@require_http_methods(["POST"])
def create_recipe(request):
    if not _is_admin_user(request.user):
        return _json_error("Admin access required.", status=403)

    payload = {}
    image = None
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        recipe_payload = request.POST.get("recipe", "{}")
        try:
            payload = json.loads(recipe_payload)
        except json.JSONDecodeError:
            return _json_error("Invalid recipe payload.")
        image = request.FILES.get("image")
    else:
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
        image=image,
    )

    for ingredient_data in cleaned_data["ingredients"]:
        ingredient = Ingredient.objects.create(
            name=ingredient_data["name"],
            quantity=ingredient_data["quantity"],
        )
        recipe.ingredients.add(ingredient)

    return JsonResponse(
        {"message": "Recipe created successfully.", "recipe": _serialize_recipe(recipe, _favorite_recipe_ids(request.user))},
        status=201,
    )


@require_http_methods(["GET", "PUT", "DELETE"])
def recipe_detail_api(request, recipe_id):
    recipe = Recipe.objects.filter(id=recipe_id).prefetch_related("ingredients").first()
    if not recipe:
        return _json_error("Recipe not found.", status=404)

    if request.method == "GET":
        return JsonResponse({"recipe": _serialize_recipe(recipe, _favorite_recipe_ids(request.user))})

    if not _is_admin_user(request.user):
        return _json_error("Admin access required.", status=403)

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

    return JsonResponse({"message": "Recipe updated successfully.", "recipe": _serialize_recipe(recipe, _favorite_recipe_ids(request.user))})


@ensure_csrf_cookie
@require_http_methods(["POST"])
def api_login(request):
    try:
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")
    except (json.JSONDecodeError, AttributeError):
        return _json_error("Invalid request data.")

    if not username or not password:
        return _json_error("Username and password are required.")

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_admin": _is_admin_user(user)
            }
        })
    else:
        return _json_error("Invalid username or password.", status=401)


@ensure_csrf_cookie
@require_http_methods(["POST"])
def api_signup(request):
    try:
        data = json.loads(request.body)
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
    except (json.JSONDecodeError, AttributeError):
        return _json_error("Invalid request data.")

    if not username or not email or not password:
        return _json_error("Username, email, and password are required.")

    if User.objects.filter(username=username).exists():
        return _json_error("Username already exists.")
    
    if User.objects.filter(email=email).exists():
        return _json_error("Email already exists.")

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_admin=False
        )
        login(request, user)
        return JsonResponse({
            "message": "User created successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_admin": _is_admin_user(user)
            }
        }, status=201)
    except Exception as e:
        return _json_error(f"Failed to create user: {str(e)}")


@require_http_methods(["POST", "GET"])
def api_logout(request):
    logout(request)
    return JsonResponse({"message": "Logout successful"})


@require_http_methods(["GET"])
def get_session_info(request):
    if request.user.is_authenticated:
        return JsonResponse({
            "authenticated": True,
            "user": {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "is_admin": _is_admin_user(request.user)
            }
        })
    return JsonResponse({"authenticated": False})


@require_http_methods(["GET"])
def list_favorites(request):
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    favourite_list = Favourite.objects.filter(user=request.user).prefetch_related(
        "recipes__ingredients"
    ).first()
    recipes = []
    if favourite_list:
        favorite_ids = _favorite_recipe_ids(request.user)
        recipes = [_serialize_recipe(recipe, favorite_ids) for recipe in favourite_list.recipes.all()]
    return JsonResponse({"recipes": recipes})


@require_http_methods(["POST", "DELETE"])
def toggle_favorite(request, recipe_id):
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    recipe = Recipe.objects.filter(id=recipe_id).first()
    if not recipe:
        return _json_error("Recipe not found.", status=404)

    favourite_list, _ = Favourite.objects.get_or_create(user=request.user)

    if request.method == "POST":
        if favourite_list.recipes.filter(id=recipe.id).exists():
            return _json_error("Recipe already in favorites.", status=409)
        favourite_list.recipes.add(recipe)
        return JsonResponse({"message": "Recipe added to favorites."}, status=201)

    if not favourite_list.recipes.filter(id=recipe.id).exists():
        return _json_error("Recipe is not in favorites.", status=404)
    favourite_list.recipes.remove(recipe)
    return JsonResponse({"message": "Recipe removed from favorites."})
