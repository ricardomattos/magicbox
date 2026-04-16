from django.db import migrations, models


def set_crossfit_existing(apps, schema_editor):
    Plano = apps.get_model("planos", "Plano")
    Plano.objects.update(tem_crossfit=True)


class Migration(migrations.Migration):

    dependencies = [
        ("planos", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="plano",
            name="tem_crossfit",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="plano",
            name="tem_hyrox",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(set_crossfit_existing, migrations.RunPython.noop),
    ]
