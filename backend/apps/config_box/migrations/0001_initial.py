# Generated migration for config_box app

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='BoxConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('checkin_release_hour', models.PositiveIntegerField(default=18)),
                ('coach_msg', models.CharField(blank=True, default='', max_length=150)),
            ],
            options={
                'db_table': 'box_config',
            },
        ),
    ]
