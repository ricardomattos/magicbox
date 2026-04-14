from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("role", "gestor")
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [("aluno", "Aluno"), ("gestor", "Gestor")]

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True, default="")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="aluno")
    plano = models.ForeignKey(
        "planos.Plano", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="alunos"
    )
    must_change_pass = models.BooleanField(default=True)
    birth_date = models.DateField(null=True, blank=True)
    since = models.DateField(auto_now_add=True)       # registration date

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    treinos_total = models.PositiveIntegerField(default=0)
    treinos_mes = models.PositiveIntegerField(default=0)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        db_table = "users"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} <{self.email}>"

    @property
    def since_key(self):
        """Returns YYYY-MM string used by frontend payment logic."""
        return self.since.strftime("%Y-%m")
