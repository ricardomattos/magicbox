from django.contrib import admin
from .models import HorarioTemplate, Horario, Checkin


@admin.register(HorarioTemplate)
class HorarioTemplateAdmin(admin.ModelAdmin):
    list_display = ("dia_semana", "hora", "vagas", "ativo")
    list_filter = ("dia_semana", "ativo")


@admin.register(Horario)
class HorarioAdmin(admin.ModelAdmin):
    list_display = ("data", "hora", "vagas", "confirmados_count")
    list_filter = ("data",)


@admin.register(Checkin)
class CheckinAdmin(admin.ModelAdmin):
    list_display = ("aluno", "horario", "ativo", "criado_em")
    list_filter = ("ativo", "horario__data")
    search_fields = ("aluno__name", "aluno__email")
