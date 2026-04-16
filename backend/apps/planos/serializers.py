from rest_framework import serializers
from .models import Plano, Pagamento


class PlanoSerializer(serializers.ModelSerializer):
    alunos_count = serializers.SerializerMethodField()

    class Meta:
        model = Plano
        fields = ["id", "nome", "frequencia", "valor", "cor", "ativo",
                  "tem_crossfit", "tem_hyrox", "alunos_count"]

    def get_alunos_count(self, obj):
        return obj.alunos.filter(is_active=True).count()

    def validate(self, data):
        tem_crossfit = data.get("tem_crossfit", getattr(self.instance, "tem_crossfit", False))
        tem_hyrox = data.get("tem_hyrox", getattr(self.instance, "tem_hyrox", False))
        if not tem_crossfit and not tem_hyrox:
            raise serializers.ValidationError("Selecione ao menos uma modalidade (Crossfit ou Hyrox).")
        return data


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
