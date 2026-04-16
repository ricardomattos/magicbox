from django.db import models


class Plano(models.Model):
    nome = models.CharField(max_length=100)
    frequencia = models.CharField(max_length=100, blank=True, default="Ilimitado")
    valor = models.DecimalField(max_digits=8, decimal_places=2)
    cor = models.CharField(max_length=20, default="#2979FF")
    ativo = models.BooleanField(default=True)
    tem_crossfit = models.BooleanField(default=False)
    tem_hyrox = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "planos"
        ordering = ["nome"]

    def __str__(self):
        return f"{self.nome} — R${self.valor}"


class Pagamento(models.Model):
    """Records a paid month for a student. One record = one paid month."""
    aluno = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="pagamentos"
    )
    mes = models.CharField(max_length=7)   # "YYYY-MM"
    pago_em = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True,
        related_name="pagamentos_registrados"
    )

    class Meta:
        db_table = "pagamentos"
        unique_together = ("aluno", "mes")
        ordering = ["-mes"]

    def __str__(self):
        return f"{self.aluno.name} — {self.mes}"
