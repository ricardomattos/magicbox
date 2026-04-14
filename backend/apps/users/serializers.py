from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class UserSerializer(serializers.ModelSerializer):
    since_key = serializers.ReadOnlyField()
    plano_nome = serializers.SerializerMethodField()
    plano_cor = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "name", "phone", "role",
            "plano", "plano_nome", "plano_cor",
            "must_change_pass", "since", "since_key",
            "treinos_total", "treinos_mes",
        ]
        read_only_fields = ["id", "since", "since_key", "treinos_total", "treinos_mes"]

    def get_plano_nome(self, obj):
        return obj.plano.nome if obj.plano else None

    def get_plano_cor(self, obj):
        return obj.plano.cor if obj.plano else None


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=4)

    class Meta:
        model = User
        fields = ["id", "email", "name", "phone", "role", "plano", "password", "must_change_pass"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=6)

    def update(self, instance, validated_data):
        instance.set_password(validated_data["new_password"])
        instance.must_change_pass = False
        instance.save()
        return instance


class ResetPasswordSerializer(serializers.Serializer):
    """Coach resets a student's password to a temp value."""
    temp_password = serializers.CharField(default="1234", required=False)

    def update(self, instance, validated_data):
        temp = validated_data.get("temp_password", "1234")
        instance.set_password(temp)
        instance.must_change_pass = True
        instance.save()
        return instance


class PublicRegisterSerializer(serializers.Serializer):
    name     = serializers.CharField(max_length=150)
    email    = serializers.EmailField()
    password = serializers.CharField(min_length=6)
    phone    = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    plano    = serializers.IntegerField(required=False, allow_null=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado.")
        return value

    def create(self, validated_data):
        plano_id = validated_data.pop("plano", None)
        password = validated_data.pop("password")
        user = User(role="aluno", must_change_pass=False, **validated_data)
        if plano_id:
            user.plano_id = plano_id
        user.set_password(password)
        user.save()
        return user


class LoginResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()
