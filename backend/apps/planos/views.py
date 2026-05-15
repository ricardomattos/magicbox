from datetime import date
from django.db.models import Exists, OuterRef
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Plano, Pagamento
from .serializers import PlanoSerializer, TogglePagamentoSerializer
from apps.users.models import User
from apps.users.views import IsGestor


class PlanoListCreateView(generics.ListCreateAPIView):
    queryset = Plano.objects.filter(ativo=True)
    serializer_class = PlanoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsGestor()]
        return [permissions.IsAuthenticated()]


class PlanoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Plano.objects.all()
    serializer_class = PlanoSerializer
    permission_classes = [IsGestor]

    def destroy(self, request, *args, **kwargs):
        plano = self.get_object()
        # Soft delete
        plano.ativo = False
        plano.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PagamentosAlunoView(APIView):
    """GET: list paid months. POST: toggle a month (pay/unpay)."""

    def get_aluno(self, pk, request):
        if request.user.role == "gestor":
            return User.objects.filter(pk=pk, role="aluno").first()
        # Student can only view their own
        if str(request.user.pk) == str(pk):
            return request.user
        return None

    def get(self, request, pk):
        aluno = self.get_aluno(pk, request)
        if not aluno:
            return Response({"detail": "Não encontrado."}, status=404)
        meses = list(
            Pagamento.objects.filter(aluno=aluno).values_list("mes", flat=True)
        )
        return Response({"meses_pagos": meses})

    def post(self, request, pk):
        if request.user.role != "gestor":
            return Response({"detail": "Apenas gestores podem registrar pagamentos."}, status=403)
        aluno = User.objects.filter(pk=pk, role="aluno").first()
        if not aluno:
            return Response({"detail": "Aluno não encontrado."}, status=404)

        ser = TogglePagamentoSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        mes = ser.validated_data["mes"]

        pag, created = Pagamento.objects.get_or_create(
            aluno=aluno, mes=mes,
            defaults={"registrado_por": request.user}
        )
        if not created:
            # Toggle off — remove payment
            pag.delete()
            return Response({"mes": mes, "pago": False})

        return Response({"mes": mes, "pago": True}, status=status.HTTP_201_CREATED)


class ResumoView(APIView):
    """GET /api/planos/resumo/ — dashboard summary for coaches."""
    permission_classes = [IsGestor]

    def get(self, request):
        today = date.today()
        cur_key = today.strftime("%Y-%m")

        # Alunos who haven't paid the current month
        paid_cur = Pagamento.objects.filter(aluno=OuterRef("pk"), mes=cur_key)
        inadimplentes_qs = (
            User.objects
            .filter(role="aluno", is_active=True)
            .exclude(Exists(paid_cur))
            .values("id", "name")
        )
        inadimplentes = list(inadimplentes_qs)

        return Response({
            "inadimplentes_count": len(inadimplentes),
            "inadimplentes": inadimplentes,
        })
