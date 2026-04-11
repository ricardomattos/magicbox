# Generated migration for horarios app

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
            name='HorarioTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dia_semana', models.IntegerField()),
                ('hora', models.TimeField()),
                ('vagas', models.PositiveIntegerField(default=12)),
                ('ativo', models.BooleanField(default=True)),
            ],
            options={
                'db_table': 'horario_templates',
                'ordering': ['dia_semana', 'hora'],
                'unique_together': {('dia_semana', 'hora')},
            },
        ),
        migrations.CreateModel(
            name='Horario',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data', models.DateField()),
                ('hora', models.TimeField()),
                ('vagas', models.PositiveIntegerField(default=12)),
            ],
            options={
                'db_table': 'horarios',
                'ordering': ['data', 'hora'],
                'unique_together': {('data', 'hora')},
            },
        ),
        migrations.CreateModel(
            name='Checkin',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('ativo', models.BooleanField(default=True)),
                ('aluno', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='checkins', to=settings.AUTH_USER_MODEL)),
                ('horario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='checkins', to='horarios.horario')),
            ],
            options={
                'db_table': 'checkins',
                'ordering': ['criado_em'],
                'unique_together': {('aluno', 'horario')},
            },
        ),
    ]
