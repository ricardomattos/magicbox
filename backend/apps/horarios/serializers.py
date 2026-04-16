from rest_framework import serializers
from .models import HorarioTemplate, Horario, Checkin
from apps.users.serializers import UserSerializer


class HorarioTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioTemplate
        fields = ["id", "dia_semana", "hora", "vagas", "ativo", "modalidade"]


class CheckinSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.CharField(source="aluno.name", read_only=True)
    aluno_plano = serializers.SerializerMethodField()

    class Meta:
        model = Checkin
        fields = ["id", "aluno", "aluno_nome", "aluno_plano", "criado_em", "ativo"]
        read_only_fields = ["id", "criado_em"]

    def get_aluno_plano(self, obj):
        return obj.aluno.plano.nome if obj.aluno.plano else None


class HorarioSerializer(serializers.ModelSerializer):
    confirmados = serializers.SerializerMethodField()
    confirmados_count = serializers.ReadOnlyField()
    vagas_livres = serializers.ReadOnlyField()
    meu_checkin_id = serializers.SerializerMethodField()

    class Meta:
        model = Horario
        fields = [
            "id", "data", "hora", "vagas", "modalidade",
            "confirmados_count", "vagas_livres",
            "confirmados", "meu_checkin_id",
        ]

    def get_confirmados(self, obj):
        checkins = obj.checkins.filter(ativo=True).select_related("aluno__plano")
        return CheckinSerializer(checkins, many=True).data

    def get_meu_checkin_id(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        ci = obj.checkins.filter(aluno=request.user, ativo=True).first()
        return ci.id if ci else None
