from rest_framework import serializers
from .models import Plano, Pagamento


class PlanoSerializer(serializers.ModelSerializer):
    alunos_count = serializers.SerializerMethodField()

    class Meta:
        model = Plano
        fields = ["id", "nome", "frequencia", "valor", "cor", "ativo", "alunos_count"]

    def get_alunos_count(self, obj):
        return obj.alunos.filter(is_active=True).count()


class PagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pagamento
        fields = ["id", "aluno", "mes", "pago_em"]
        read_only_fields = ["id", "pago_em"]


class PagamentosAlunoSerializer(serializers.Serializer):
    """Returns list of paid month-keys for a student."""
    meses_pagos = serializers.ListField(child=serializers.CharField())


class TogglePagamentoSerializer(serializers.Serializer):
    mes = serializers.RegexField(r"^\d{4}-\d{2}$", help_text="YYYY-MM")
