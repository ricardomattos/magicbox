from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("horarios", "0002_initial"),
    ]

    operations = [
        # 1. Add field (default='crossfit' covers existing rows)
        migrations.AddField(
            model_name="horariotemplate",
            name="modalidade",
            field=models.CharField(
                choices=[("crossfit", "CrossFit"), ("hyrox", "Hyrox")],
                default="crossfit",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="horario",
            name="modalidade",
            field=models.CharField(
                choices=[("crossfit", "CrossFit"), ("hyrox", "Hyrox")],
                default="crossfit",
                max_length=10,
            ),
        ),
        # 2. Replace unique_together to include modalidade
        migrations.AlterUniqueTogether(
            name="horariotemplate",
            unique_together={("dia_semana", "hora", "modalidade")},
        ),
        migrations.AlterUniqueTogether(
            name="horario",
            unique_together={("data", "hora", "modalidade")},
        ),
    ]
