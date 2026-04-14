from django.db import models


class BoxConfig(models.Model):
    """Singleton config for the box. Only one row exists."""
    checkin_release_hour = models.PositiveIntegerField(default=18)
    coach_msg = models.CharField(max_length=150, blank=True, default="")
    pix_key = models.CharField(max_length=150, blank=True, default="")

    class Meta:
        db_table = "box_config"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f"Config (release={self.checkin_release_hour}h)"
