import uuid
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User
from .serializers import (
    UserSerializer, UserCreateSerializer,
    ChangePasswordSerializer, ResetPasswordSerializer,
    PublicRegisterSerializer,
)
from apps.config_box.models import BoxConfig
from apps.planos.models import Plano
from apps.planos.serializers import PlanoSerializer


class IsGestor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "gestor"


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "")
        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({"detail": "E-mail ou senha incorretos."}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        })


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    def post(self, request):
        ser = ChangePasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.update(request.user, ser.validated_data)
        return Response({"detail": "Senha alterada com sucesso."})


class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.filter(role="aluno").select_related("plano")
    permission_classes = [IsGestor]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer


class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsGestor]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return UserCreateSerializer
        return UserSerializer


class ResetPasswordView(APIView):
    permission_classes = [IsGestor]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk, role="aluno")
        except User.DoesNotExist:
            return Response({"detail": "Aluno não encontrado."}, status=404)
        ser = ResetPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.update(user, ser.validated_data)
        return Response({"detail": "Senha resetada. O aluno deverá criar uma nova senha no próximo acesso."})


class InviteView(APIView):
    """Gestor-only: retrieve or regenerate the box invite token."""
    permission_classes = [IsGestor]

    def get(self, request):
        config = BoxConfig.get()
        return Response({"token": str(config.invite_token)})

    def post(self, request):
        config = BoxConfig.get()
        config.invite_token = uuid.uuid4()
        config.save(update_fields=["invite_token"])
        return Response({"token": str(config.invite_token)})


class PublicRegisterView(APIView):
    """Public: validate invite token, list plans, and register a student."""
    permission_classes = [permissions.AllowAny]

    def _validate_token(self, token):
        try:
            uuid.UUID(token)
        except ValueError:
            return None
        config = BoxConfig.get()
        if str(config.invite_token) != token:
            return None
        return config

    def get(self, request, token):
        if not self._validate_token(token):
            return Response({"detail": "Link de cadastro inválido."}, status=400)
        planos = Plano.objects.filter(ativo=True)
        return Response({
            "valid": True,
            "planos": PlanoSerializer(planos, many=True).data,
        })

    def post(self, request, token):
        if not self._validate_token(token):
            return Response({"detail": "Link de cadastro inválido."}, status=400)
        ser = PublicRegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({"detail": "Cadastro realizado! Faça login para acessar o app."}, status=201)
