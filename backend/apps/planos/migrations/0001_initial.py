# Generated migration for planos app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Plano',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=100)),
                ('frequencia', models.CharField(blank=True, default='Ilimitado', max_length=100)),
                ('valor', models.DecimalField(decimal_places=2, max_digits=8)),
                ('cor', models.CharField(default='#2979FF', max_length=20)),
                ('ativo', models.BooleanField(default=True)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'planos',
                'ordering': ['nome'],
            },
        ),
        migrations.CreateModel(
            name='Pagamento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mes', models.CharField(max_length=7)),
                ('pago_em', models.DateTimeField(auto_now_add=True)),
                ('aluno', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pagamentos', to=settings.AUTH_USER_MODEL)),
                ('registrado_por', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='pagamentos_registrados', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'pagamentos',
                'ordering': ['-mes'],
                'unique_together': {('aluno', 'mes')},
            },
        ),
    ]
