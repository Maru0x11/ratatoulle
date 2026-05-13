import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from .models import Favourite, Recipe, User


@override_settings(ALLOWED_HOSTS=["testserver", "localhost", "127.0.0.1"])
class RecipeApiTests(TestCase):
    def setUp(self):
        self.media_root = tempfile.mkdtemp()
        self.media_override = override_settings(MEDIA_ROOT=self.media_root)
        self.media_override.enable()

        self.user = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="pass12345",
        )
        self.recipe = Recipe.objects.create(
            title="Basbousa",
            description="Semolina cake",
            recipe_type=Recipe.CourseType.DESSERT,
            author=self.user,
            image=SimpleUploadedFile("cake.jpg", b"fake-image-bytes", content_type="image/jpeg"),
        )

    def tearDown(self):
        self.media_override.disable()
        shutil.rmtree(self.media_root, ignore_errors=True)

    def test_search_page_sets_csrf_cookie_for_frontend_posts(self):
        response = self.client.get("/search.html")

        self.assertEqual(response.status_code, 200)
        self.assertIn("csrftoken", response.cookies)

    def test_adding_favorite_is_returned_in_favorites_list(self):
        self.client.force_login(self.user)

        add_response = self.client.post(f"/api/favorites/{self.recipe.id}/")
        list_response = self.client.get("/api/favorites/")

        self.assertEqual(add_response.status_code, 201)
        self.assertEqual(list_response.status_code, 200)
        self.assertTrue(Favourite.objects.filter(user=self.user, recipes=self.recipe).exists())
        self.assertEqual(list_response.json()["recipes"][0]["id"], self.recipe.id)
        self.assertTrue(list_response.json()["recipes"][0]["is_favorite"])

    def test_recipe_list_marks_only_saved_recipes_as_favorite(self):
        self.client.force_login(self.user)

        other = Recipe.objects.create(
            title="Soup",
            description="Warm",
            recipe_type=Recipe.CourseType.MAIN_COURSE,
            author=self.user,
        )
        self.client.post(f"/api/favorites/{self.recipe.id}/")

        response = self.client.get("/api/recipes/")
        payload = {item["id"]: item for item in response.json()["recipes"]}

        self.assertTrue(payload[self.recipe.id]["is_favorite"])
        self.assertFalse(payload[other.id]["is_favorite"])

    def test_recipe_list_exposes_uploaded_image_url(self):
        self.client.force_login(self.user)

        response = self.client.get("/api/recipes/")

        self.assertEqual(response.status_code, 200)
        recipe_payload = response.json()["recipes"][0]
        self.assertEqual(recipe_payload["id"], self.recipe.id)
        self.assertTrue(recipe_payload["image_url"].startswith("/media/recipe_photos/"))
