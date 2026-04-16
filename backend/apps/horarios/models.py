from django.db import models


MODALIDADE_CHOICES = [("crossfit", "CrossFit"), ("hyrox", "Hyrox")]


class HorarioTemplate(models.Model):
    """Reusable slot template per weekday (0=Mon … 6=Sun)."""
    dia_semana = models.IntegerField()   # 0=Mon, 6=Sun (Python weekday)
    hora = models.TimeField()
    vagas = models.PositiveIntegerField(default=12)
    ativo = models.BooleanField(default=True)
    modalidade = models.CharField(max_length=10, choices=MODALIDADE_CHOICES, default="crossfit")

    class Meta:
        db_table = "horario_templates"
        ordering = ["dia_semana", "hora"]
        unique_together = ("dia_semana", "hora", "modalidade")

    def __str__(self):
        dias = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"]
        return f"{dias[self.dia_semana]} {self.hora.strftime('%H:%M')} ({self.vagas} vagas)"


class Horario(models.Model):
    """A concrete class slot for a specific date."""
    data = models.DateField()
    hora = models.TimeField()
    vagas = models.PositiveIntegerField(default=12)
    modalidade = models.CharField(max_length=10, choices=MODALIDADE_CHOICES, default="crossfit")

    class Meta:
        db_table = "horarios"
        ordering = ["data", "hora"]
        unique_together = ("data", "hora", "modalidade")

    def __str__(self):
        return f"{self.data} {self.hora.strftime('%H:%M')}"

    @property
    def confirmados_count(self):
        return self.checkins.filter(ativo=True).count()

    @property
    def vagas_livres(self):
        return max(0, self.vagas - self.confirmados_count)


class Checkin(models.Model):
    aluno = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="checkins"
    )
    horario = models.ForeignKey(
        Horario, on_delete=models.CASCADE, related_name="checkins"
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    ativo = models.BooleanField(default=True)   # False = released

    class Meta:
        db_table = "checkins"
        unique_together = ("aluno", "horario")
        ordering = ["criado_em"]

    def __str__(self):
        return f"{self.aluno.name} @ {self.horario}"
