from django.urls import path
from .views import PlanoListCreateView, PlanoDetailView, PagamentosAlunoView

urlpatterns = [
    path("", PlanoListCreateView.as_view()),
    path("<int:pk>/", PlanoDetailView.as_view()),
    path("pagamentos/<int:pk>/", PagamentosAlunoView.as_view()),
]
