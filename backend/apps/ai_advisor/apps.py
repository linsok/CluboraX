from django.apps import AppConfig


class AIAdvisorConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ai_advisor'
    verbose_name = 'AI Advisor'

    def ready(self):
        import sys
        import os
        # Avoid loading heavy models during migrations, testing, or static asset collection
        ignored_commands = {'migrate', 'makemigrations', 'collectstatic', 'test', 'check'}
        if not any(cmd in sys.argv for cmd in ignored_commands):
            # Prevent loading the model in the reloader parent process to save memory
            if 'runserver' in sys.argv and os.environ.get('RUN_MAIN') != 'true':
                return
            try:
                from .rag_service import RAGChatService
                # Instantiate RAGChatService to trigger background initialization
                RAGChatService()
            except Exception:
                pass

