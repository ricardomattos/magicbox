from django.urls import path
from .views import (
    MeView, ChangePasswordView,
    UserListCreateView, UserDetailView, ResetPasswordView,
)

urlpatterns = [
    path("me/", MeView.as_view()),
    path("me/change-password/", ChangePasswordView.as_view()),
    path("", UserListCreateView.as_view()),
    path("<int:pk>/", UserDetailView.as_view()),
    path("<int:pk>/reset-password/", ResetPasswordView.as_view()),
]
