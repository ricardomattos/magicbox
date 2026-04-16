from datetime import date, timedelta, datetime
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import HorarioTemplate, Horario, Checkin
from .serializers import HorarioTemplateSerializer, HorarioSerializer, CheckinSerializer
from apps.users.views import IsGestor
from apps.planos.models import Pagamento


def pode_fazer_checkin(user):
    """Allow check-in if the student paid either the current or the previous month.
    Blocks only if both months are unpaid (genuinely delinquent).
    New students registered this month are always allowed."""
    from datetime import date
    today = date.today()
    cur_mes  = today.strftime("%Y-%m")
    prev_mes = f"{today.year if today.month > 1 else today.year - 1}-{str(today.month - 1 if today.month > 1 else 12).zfill(2)}"

    # Registered this month → no payment expected yet
    since_key = user.since.strftime("%Y-%m")
    if since_key >= cur_mes:
        return True

    # OK if paid at least one of: current month or previous month
    return Pagamento.objects.filter(aluno=user, mes__in=[cur_mes, prev_mes]).exists()


# ── Templates ──────────────────────────────────────────────────────────────────
class TemplateListCreateView(generics.ListCreateAPIView):
    serializer_class = HorarioTemplateSerializer
    permission_classes = [IsGestor]
    pagination_class = None

    def get_queryset(self):
        qs = HorarioTemplate.objects.filter(ativo=True)
        modalidade = self.request.query_params.get("modalidade")
        if modalidade in ("crossfit", "hyrox"):
            qs = qs.filter(modalidade=modalidade)
        return qs


class TemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = HorarioTemplate.objects.all()
    serializer_class = HorarioTemplateSerializer
    permission_classes = [IsGestor]


class ReplicarTemplateView(APIView):
    """Replicates templates from one weekday to all weekdays (Mon–Fri)."""
    permission_classes = [IsGestor]

    def post(self, request):
        dia_origem = request.data.get("dia_semana")
        modalidade = request.data.get("modalidade", "crossfit")
        if dia_origem is None:
            return Response({"detail": "dia_semana é obrigatório."}, status=400)
        if modalidade not in ("crossfit", "hyrox"):
            return Response({"detail": "modalidade inválida."}, status=400)

        templates_origem = HorarioTemplate.objects.filter(dia_semana=dia_origem, modalidade=modalidade, ativo=True)
        criados = 0
        for d in range(5):  # 0=Mon to 4=Fri
            if d == dia_origem:
                continue
            for t in templates_origem:
                HorarioTemplate.objects.update_or_create(
                    dia_semana=d, hora=t.hora, modalidade=modalidade,
                    defaults={"vagas": t.vagas, "ativo": True}
                )
                criados += 1
        return Response({"detail": f"{criados} templates replicados."})


# ── Horarios (concrete slots) ───────────────────────────────────────────────────
class HorarioListView(APIView):
    """Returns slots for a specific date (default: today).

    Auto-generates concrete Horario rows from active HorarioTemplate records
    the first time a date is queried, so students always see the weekly schedule
    without the gestor needing to create slots manually.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data_str = request.query_params.get("data")
        modalidade = request.query_params.get("modalidade", "crossfit")
        if modalidade not in ("crossfit", "hyrox"):
            modalidade = "crossfit"

        try:
            data = date.fromisoformat(data_str) if data_str else date.today()
        except ValueError:
            return Response({"detail": "Data inválida. Use YYYY-MM-DD."}, status=400)

        # Python weekday(): Mon=0 … Sun=6 — matches HorarioTemplate.dia_semana
        dia_semana = data.weekday()
        templates = HorarioTemplate.objects.filter(dia_semana=dia_semana, modalidade=modalidade, ativo=True)
        for tmpl in templates:
            Horario.objects.get_or_create(
                data=data,
                hora=tmpl.hora,
                modalidade=modalidade,
                defaults={"vagas": tmpl.vagas},
            )

        horarios = Horario.objects.filter(data=data, modalidade=modalidade).prefetch_related(
            "checkins__aluno__plano"
        )

        # Alunos não veem horários que já passaram no dia de hoje
        if data == date.today() and request.user.role != "gestor":
            now_time = datetime.now().time()
            horarios = horarios.filter(hora__gt=now_time)

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

        if not pode_fazer_checkin(request.user):
            return Response(
                {"detail": "Mensalidade em atraso. Regularize para fazer check-in."},
                status=403
            )

        # Check if already has an active checkin today or tomorrow for the same modality
        from datetime import date
        today = date.today()
        tomorrow = today + timedelta(days=1)
        try:
            horario = Horario.objects.get(pk=horario_id)
        except Horario.DoesNotExist:
            return Response({"detail": "Horário não encontrado."}, status=404)

        existing = Checkin.objects.filter(
            aluno=request.user,
            horario__data__in=[today, tomorrow],
            horario__modalidade=horario.modalidade,
            ativo=True
        ).first()
        if existing:
            return Response(
                {"detail": "Você já tem um check-in ativo nesta modalidade. Libere-o antes de reservar outro."},
                status=400
            )

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
