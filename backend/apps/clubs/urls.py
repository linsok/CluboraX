from django.urls import path
from . import views

app_name = 'clubs'

urlpatterns = [
    # Club management
    path('', views.ClubListCreateView.as_view(), name='club_list_create'),
    path('<uuid:pk>/', views.ClubDetailView.as_view(), name='club_detail'),
    path('stats/', views.ClubStatsView.as_view(), name='club_stats'),
    
    # Club memberships
    path('memberships/', views.ClubMembershipListCreateView.as_view(), name='membership_list_create'),
    path('memberships/<uuid:pk>/', views.ClubMembershipDetailView.as_view(), name='membership_detail'),
    path('memberships/<uuid:membership_id>/action/', views.ClubMembershipActionView.as_view(), name='membership_action'),
    
    # Club approvals
    path('approvals/', views.ClubApprovalListView.as_view(), name='approval_list'),
    path('approvals/<uuid:approval_id>/action/', views.ClubApprovalActionView.as_view(), name='approval_action'),
    
    # Club activities
    path('activities/', views.ClubActivityListCreateView.as_view(), name='activity_list_create'),
    
    # Club announcements
    path('announcements/', views.ClubAnnouncementListCreateView.as_view(), name='announcement_list_create'),
    
    # Club resources
    path('resources/', views.ClubResourceListCreateView.as_view(), name='resource_list_create'),
    
    # Club feedback
    path('feedback/', views.ClubFeedbackListCreateView.as_view(), name='feedback_list_create'),
]
