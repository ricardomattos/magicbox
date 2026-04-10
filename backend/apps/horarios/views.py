from datetime import date, timedelta
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import HorarioTemplate, Horario, Checkin
from .serializers import HorarioTemplateSerializer, HorarioSerializer, CheckinSerializer
from apps.users.views import IsGestor
from apps.planos.models import Pagamento


def mes_atual_pago(user):
    """Check if current month is paid for a student."""
    from datetime import date
    mes = date.today().strftime("%Y-%m")
    return Pagamento.objects.filter(aluno=user, mes=mes).exists()


# ── Templates ──────────────────────────────────────────────────────────────────
class TemplateListCreateView(generics.ListCreateAPIView):
    queryset = HorarioTemplate.objects.filter(ativo=True)
    serializer_class = HorarioTemplateSerializer
    permission_classes = [IsGestor]


class TemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = HorarioTemplate.objects.all()
    serializer_class = HorarioTemplateSerializer
    permission_classes = [IsGestor]


class ReplicarTemplateView(APIView):
    """Replicates templates from one weekday to all weekdays (Mon–Fri)."""
    permission_classes = [IsGestor]

    def post(self, request):
        dia_origem = request.data.get("dia_semana")
        if dia_origem is None:
            return Response({"detail": "dia_semana é obrigatório."}, status=400)

        templates_origem = HorarioTemplate.objects.filter(dia_semana=dia_origem, ativo=True)
        criados = 0
        for d in range(5):  # 0=Mon to 4=Fri
            if d == dia_origem:
                continue
            for t in templates_origem:
                HorarioTemplate.objects.update_or_create(
                    dia_semana=d, hora=t.hora,
                    defaults={"vagas": t.vagas, "ativo": True}
                )
                criados += 1
        return Response({"detail": f"{criados} templates replicados."})


# ── Horarios (concrete slots) ───────────────────────────────────────────────────
class HorarioListView(APIView):
    """Returns slots for a specific date (default: today)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data_str = request.query_params.get("data")
        try:
            data = date.fromisoformat(data_str) if data_str else date.today()
        except ValueError:
            return Response({"detail": "Data inválida. Use YYYY-MM-DD."}, status=400)

        horarios = Horario.objects.filter(data=data).prefetch_related(
            "checkins__aluno__plano"
        )
        ser = HorarioSerializer(horarios, many=True, context={"request": request})
        return Response(ser.data)


class HorarioCreateView(generics.CreateAPIView):
    queryset = Horario.objects.all()
    serializer_class = HorarioSerializer
    permission_classes = [IsGestor]


class HorarioDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Horario.objects.all()
    serializer_class = HorarioSerializer
    permission_classes = [IsGestor]


# ── Check-in ───────────────────────────────────────────────────────────────────
class CheckinView(APIView):
    """POST to check in, DELETE to release."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, horario_id):
        if request.user.role != "aluno":
            return Response({"detail": "Apenas alunos podem fazer check-in."}, status=403)

        if not mes_atual_pago(request.user):
            return Response(
                {"detail": "Mensalidade em aberto. Regularize para fazer check-in."},
                status=403
            )

        # Check if already has an active checkin today or tomorrow
        from datetime import date
        today = date.today()
        tomorrow = today + timedelta(days=1)
        existing = Checkin.objects.filter(
            aluno=request.user,
            horario__data__in=[today, tomorrow],
            ativo=True
        ).first()
        if existing:
            return Response(
                {"detail": "Você já tem um check-in ativo. Libere-o antes de reservar outro."},
                status=400
            )

        try:
            horario = Horario.objects.get(pk=horario_id)
        except Horario.DoesNotExist:
            return Response({"detail": "Horário não encontrado."}, status=404)

        if horario.vagas_livres <= 0:
            return Response({"detail": "Sem vagas disponíveis."}, status=400)

        checkin, created = Checkin.objects.get_or_create(
            aluno=request.user, horario=horario,
            defaults={"ativo": True}
        )
        if not created:
            if checkin.ativo:
                return Response({"detail": "Você já está confirmado neste horário."}, status=400)
            checkin.ativo = True
            checkin.save()

        # Increment treino counter
        request.user.treinos_total += 1
        request.user.treinos_mes += 1
        request.user.save(update_fields=["treinos_total", "treinos_mes"])

        return Response(CheckinSerializer(checkin).data, status=201)

    def delete(self, request, horario_id):
        try:
            checkin = Checkin.objects.get(
                aluno=request.user, horario_id=horario_id, ativo=True
            )
        except Checkin.DoesNotExist:
            return Response({"detail": "Check-in não encontrado."}, status=404)

        checkin.ativo = False
        checkin.save()

        # Decrement counter
        if request.user.treinos_total > 0:
            request.user.treinos_total -= 1
        if request.user.treinos_mes > 0:
            request.user.treinos_mes -= 1
        request.user.save(update_fields=["treinos_total", "treinos_mes"])

        return Response({"detail": "Vaga liberada."})
