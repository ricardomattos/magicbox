from rest_framework import serializers, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.urls import path
from .models import BoxConfig
from apps.users.views import IsGestor


class BoxConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoxConfig
        fields = ["checkin_release_hour", "coach_msg", "pix_key"]


class BoxConfigView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.IsAuthenticated()]
        return [IsGestor()]

    def get(self, request):
        return Response(BoxConfigSerializer(BoxConfig.get()).data)

    def patch(self, request):
        config = BoxConfig.get()
        ser = BoxConfigSerializer(config, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


urlpatterns = [
    path("", BoxConfigView.as_view()),
]
