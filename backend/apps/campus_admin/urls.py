from django.urls import path, include
from . import views

app_name = 'admin'

urlpatterns = [
    # Dashboard
    path('', views.admin_dashboard, name='dashboard'),
    
    # User Management
    path('users/', views.user_management, name='user_management'),
    path('users/<uuid:user_id>/', views.user_detail, name='user_detail'),
    path('users/<uuid:user_id>/<str:action>/', views.user_action, name='user_action'),
    
    # Proposal Management
    path('proposals/', views.proposal_management, name='proposal_management'),
    path('proposals/<uuid:proposal_id>/', views.proposal_detail, name='proposal_detail'),
    
    # Analytics
    path('analytics/', views.analytics, name='analytics'),
    
    # System Settings
    path('settings/', views.system_settings, name='system_settings'),
    
    # Announcements
    path('announcements/', views.announcements, name='announcements'),
    path('announcements/create/', views.create_announcement, name='create_announcement'),
    
    # System Logs
    path('logs/', views.system_logs, name='system_logs'),
    
    # API Endpoints
    path('api/user-stats/', views.api_user_stats, name='api_user_stats'),
    path('api/proposal-stats/', views.api_proposal_stats, name='api_proposal_stats'),
    path('api/system-health/', views.api_system_health, name='api_system_health'),
    
    # New API endpoints
    path('api/', include('apps.admin.api.urls')),
]
