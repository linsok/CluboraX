from django.urls import path
from . import views

app_name = 'admin_panel'

urlpatterns = [
    # Dashboard
    path('dashboard/', views.DashboardStatsView.as_view(), name='dashboard_stats'),
    path('quick-actions/', views.QuickActionsView.as_view(), name='quick_actions'),
    
    # Admin activities
    path('activities/', views.AdminActivityListView.as_view(), name='activity_list'),
    
    # System reports
    path('reports/', views.SystemReportListCreateView.as_view(), name='report_list_create'),
    path('reports/<uuid:pk>/', views.SystemReportDetailView.as_view(), name='report_detail'),
    
    # System settings
    path('settings/', views.SystemSettingListCreateView.as_view(), name='setting_list_create'),
    path('settings/<uuid:pk>/', views.SystemSettingDetailView.as_view(), name='setting_detail'),
    
    # System alerts
    path('alerts/', views.SystemAlertListView.as_view(), name='alert_list'),
    path('alerts/<uuid:alert_id>/action/', views.SystemAlertActionView.as_view(), name='alert_action'),
    
    # System backups
    path('backups/', views.SystemBackupListCreateView.as_view(), name='backup_list_create'),
    
    # System maintenance
    path('maintenance/', views.SystemMaintenanceListCreateView.as_view(), name='maintenance_list_create'),
]
