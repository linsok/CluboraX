from django.urls import path
from . import views

app_name = 'admin_api'

urlpatterns = [
    # Dashboard endpoints
    path('dashboard-stats/', views.dashboard_stats, name='dashboard_stats'),
    path('user-stats/', views.user_stats, name='user_stats'),
    path('proposal-stats/', views.proposal_stats, name='proposal_stats'),
    
    # User management endpoints
    path('users/', views.users_list, name='users_list'),
    path('users/<int:user_id>/activate/', views.activate_user, name='activate_user'),
    path('users/<int:user_id>/deactivate/', views.deactivate_user, name='deactivate_user'),
    path('users/<int:user_id>/verify/', views.verify_user, name='verify_user'),
    
    # Proposal management endpoints
    path('proposals/', views.proposals_list, name='proposals_list'),
    path('proposals/<int:proposal_id>/approve/', views.approve_proposal, name='approve_proposal'),
    path('proposals/<int:proposal_id>/reject/', views.reject_proposal, name='reject_proposal'),
    path('proposals/<int:proposal_id>/', views.delete_proposal, name='delete_proposal'),
    
    # System endpoints
    path('system-health/', views.system_health, name='system_health'),
    path('recent-activities/', views.recent_activities, name='recent_activities'),
    path('upcoming-events/', views.upcoming_events, name='upcoming_events'),
]
