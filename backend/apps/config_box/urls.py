from django.urls import path
from .views import BoxConfigView

urlpatterns = [
    path("", BoxConfigView.as_view()),
]
