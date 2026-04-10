from django.contrib import admin
from .models import Plano, Pagamento


@admin.register(Plano)
class PlanoAdmin(admin.ModelAdmin):
    list_display = ("nome", "valor", "frequencia", "ativo")
    list_filter = ("ativo",)


@admin.register(Pagamento)
class PagamentoAdmin(admin.ModelAdmin):
    list_display = ("aluno", "mes", "pago_em", "registrado_por")
    list_filter = ("mes",)
    search_fields = ("aluno__name", "aluno__email")
