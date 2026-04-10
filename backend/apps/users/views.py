from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User
from .serializers import (
    UserSerializer, UserCreateSerializer,
    ChangePasswordSerializer, ResetPasswordSerializer,
)


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
