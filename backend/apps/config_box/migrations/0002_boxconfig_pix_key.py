from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('config_box', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='boxconfig',
            name='pix_key',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
    ]
