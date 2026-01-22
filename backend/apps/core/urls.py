from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    path('settings/', views.system_settings, name='system_settings'),
    path('audit-logs/', views.audit_logs, name='audit_logs'),
    path('search/', views.search, name='search'),
    path('notifications/', views.notifications, name='notifications'),
    path('upload/', views.upload_file, name='upload_file'),
    path('health/', views.health_check, name='health_check'),
]
