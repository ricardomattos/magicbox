import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('config_box', '0002_boxconfig_pix_key'),
    ]

    operations = [
        migrations.AddField(
            model_name='boxconfig',
            name='invite_token',
            field=models.UUIDField(default=uuid.uuid4),
        ),
    ]
