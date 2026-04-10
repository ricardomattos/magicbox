from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import LoginView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/users/", include("apps.users.urls")),
    path("api/horarios/", include("apps.horarios.urls")),
    path("api/planos/", include("apps.planos.urls")),
    path("api/config/", include("apps.config_box.urls")),
]
