from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class AdminConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.campus_admin'
    verbose_name = _('Administration')
    
    def ready(self):
        """Import signals when app is ready"""
        try:
            import apps.campus_admin.signals
        except ImportError:
            pass
