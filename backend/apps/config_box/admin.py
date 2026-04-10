from django.contrib import admin
from .models import BoxConfig


@admin.register(BoxConfig)
class BoxConfigAdmin(admin.ModelAdmin):
    list_display = ("checkin_release_hour", "coach_msg")
