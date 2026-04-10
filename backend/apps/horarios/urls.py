from django.urls import path
from .views import (
    TemplateListCreateView, TemplateDetailView, ReplicarTemplateView,
    HorarioListView, HorarioCreateView, HorarioDetailView,
    CheckinView,
)

urlpatterns = [
    # Templates (gestor manages weekly schedule)
    path("templates/", TemplateListCreateView.as_view()),
    path("templates/<int:pk>/", TemplateDetailView.as_view()),
    path("templates/replicar/", ReplicarTemplateView.as_view()),

    # Concrete slots
    path("", HorarioListView.as_view()),          # ?data=YYYY-MM-DD
    path("create/", HorarioCreateView.as_view()),
    path("<int:pk>/", HorarioDetailView.as_view()),

    # Check-in / release
    path("<int:horario_id>/checkin/", CheckinView.as_view()),
]
