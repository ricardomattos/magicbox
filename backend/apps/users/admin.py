from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "name", "role", "plano", "must_change_pass", "is_active")
    list_filter = ("role", "is_active", "must_change_pass")
    search_fields = ("email", "name")
    ordering = ("name",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Info", {"fields": ("name", "phone", "role", "plano", "must_change_pass")}),
        ("Stats", {"fields": ("treinos_total", "treinos_mes")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser")}),
    )
    add_fieldsets = (
        (None, {"fields": ("email", "name", "phone", "role", "plano", "password1", "password2")}),
    )
