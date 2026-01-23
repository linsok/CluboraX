from django.urls import path
from . import views

app_name = 'admin_panel'

urlpatterns = [
    # Authentication
    path('login/', views.AdminLoginView.as_view(), name='admin_login'),
    
    # Dashboard
    path('dashboard/', views.DashboardStatsView.as_view(), name='dashboard_stats'),
    path('stats/', views.DashboardStatsView.as_view(), name='stats'),
    path('quick-actions/', views.QuickActionsView.as_view(), name='quick_actions'),
    
    # User Management
    path('users/', views.AdminUserListView.as_view(), name='user_list'),
    path('users/<uuid:pk>/', views.AdminUserDetailView.as_view(), name='user_detail'),
    
    # Request Management
    path('requests/', views.AdminRequestListView.as_view(), name='request_list'),
    path('requests/<uuid:pk>/', views.AdminRequestDetailView.as_view(), name='request_detail'),
    
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
    
    # Proposal management
    path('proposals/', views.ProposalListView.as_view(), name='proposal_list'),
    path('proposals/create/', views.ProposalCreateView.as_view(), name='proposal_create'),
    path('proposals/user/', views.ProposalUserListView.as_view(), name='user_proposal_list'),
    path('proposals/<uuid:proposal_id>/approve/', views.ProposalActionView.as_view(), name='approve_proposal'),
    path('proposals/<uuid:proposal_id>/reject/', views.ProposalActionView.as_view(), name='reject_proposal'),
    path('proposals/<uuid:proposal_id>/delete/', views.ProposalActionView.as_view(), name='delete_proposal'),
]
