from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    is_admin = models.BooleanField(default=False)

class Ingredient(models.Model):
    name = models.CharField(max_length=255)
    quantity = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.quantity})"
    
class Recipe(models.Model):
    class CourseType(models.TextChoices):
        APPETIZERS = 'appetizers', 'Appetizers'
        MAIN_COURSE = 'main_course', 'Main Course'
        DESSERT = 'dessert', 'Dessert'

    title = models.CharField(max_length=255)
    description = models.TextField()
    
    recipe_type = models.CharField(
        max_length=20,
        choices=CourseType.choices,
        default=CourseType.MAIN_COURSE,
    )

    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_recipes")
    ingredients = models.ManyToManyField(Ingredient, related_name="recipes")
    image = models.ImageField(upload_to='recipe_photos/', blank=True, null=True)

    def __str__(self):
        return self.title
    
class Favourite(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="favourite_list")
    recipes = models.ManyToManyField(Recipe, related_name="favourited_by")

    def __str__(self):
        return f"{self.user.username}'s Favourites"