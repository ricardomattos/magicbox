"""
Management command: python manage.py seed_data
Creates demo coach + students with plans and sample payments.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date


class Command(BaseCommand):
    help = "Seeds the database with demo data for Magic Box"

    def handle(self, *args, **options):
        from apps.users.models import User
        from apps.planos.models import Plano, Pagamento
        from apps.config_box.models import BoxConfig
        from apps.horarios.models import HorarioTemplate

        self.stdout.write("🌱 Seeding Magic Box data...")

        # Config
        BoxConfig.objects.update_or_create(
            pk=1,
            defaults={
                "checkin_release_hour": 18,
                "coach_msg": "Treino pesado essa semana! Bora superar os limites 💪🔥",
            }
        )

        # Plans
        p1, _ = Plano.objects.get_or_create(
            nome="Mensal Plus",
            defaults={"frequencia": "Ilimitado", "valor": 199, "cor": "#2979FF"}
        )
        p2, _ = Plano.objects.get_or_create(
            nome="Mensal Básico",
            defaults={"frequencia": "3x por semana", "valor": 149, "cor": "#7c4dff"}
        )
        p3, _ = Plano.objects.get_or_create(
            nome="Trimestral",
            defaults={"frequencia": "Ilimitado", "valor": 169, "cor": "#00bcd4"}
        )

        # Coach
        coach, _ = User.objects.get_or_create(
            email="coach@magic.com",
            defaults={
                "name": "Coach Felipe",
                "role": "gestor",
                "must_change_pass": False,
                "is_staff": True,
            }
        )
        coach.set_password("admin123")
        coach.save()

        # Students
        students = [
            ("Ana Lima",   "ana@magic.com",     "ana123",     p1, False),
            ("Carlos Melo","carlos@magic.com",  "carlos123",  p2, False),
            ("Juliana P.", "juliana@magic.com", "juliana123", p1, False),
            ("Rafael N.",  "rafael@magic.com",  "rafael123",  p3, True),
        ]
        today = date.today()
        cur_m = today.strftime("%Y-%m")
        prev_m = (date(today.year, today.month, 1) - timezone.timedelta(days=1)).strftime("%Y-%m")

        for name, email, pwd, plano, must_change in students:
            u, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "name": name,
                    "role": "aluno",
                    "plano": plano,
                    "must_change_pass": must_change,
                }
            )
            if created:
                u.set_password(pwd)
                u.save()

            # Ana and Rafael: current month paid
            if email in ("ana@magic.com", "rafael@magic.com"):
                Pagamento.objects.get_or_create(aluno=u, mes=cur_m, defaults={"registrado_por": coach})
            # Ana, Carlos: previous month paid
            if email in ("ana@magic.com", "carlos@magic.com"):
                Pagamento.objects.get_or_create(aluno=u, mes=prev_m, defaults={"registrado_por": coach})

        # Horario templates (Mon–Fri)
        slots = [
            ("06:00", 12), ("07:00", 12), ("08:00", 12), ("09:00", 12),
            ("17:00", 12), ("18:00", 12), ("19:00", 15), ("20:00", 12),
        ]
        for dia in range(5):  # 0=Mon to 4=Fri
            for hora_str, vagas in slots:
                from datetime import time
                h, m = hora_str.split(":")
                HorarioTemplate.objects.get_or_create(
                    dia_semana=dia, hora=time(int(h), int(m)),
                    defaults={"vagas": vagas}
                )

        self.stdout.write(self.style.SUCCESS("✅ Seed completo!"))
        self.stdout.write("  coach@magic.com  / admin123")
        self.stdout.write("  ana@magic.com    / ana123")
        self.stdout.write("  carlos@magic.com / carlos123")
        self.stdout.write("  juliana@magic.com/ juliana123")
        self.stdout.write("  rafael@magic.com / rafael123  (must change password)")
