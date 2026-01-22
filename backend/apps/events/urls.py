from django.urls import path
from . import views

app_name = 'events'

urlpatterns = [
    # Event management
    path('', views.EventListCreateView.as_view(), name='event_list_create'),
    path('<uuid:pk>/', views.EventDetailView.as_view(), name='event_detail'),
    path('stats/', views.EventStatsView.as_view(), name='event_stats'),
    path('calendar/', views.EventCalendarView.as_view(), name='event_calendar'),
    
    # Event registrations
    path('registrations/', views.EventRegistrationListCreateView.as_view(), name='registration_list_create'),
    path('registrations/<uuid:pk>/', views.EventRegistrationDetailView.as_view(), name='registration_detail'),
    path('check-in/', views.EventCheckInView.as_view(), name='event_check_in'),
    
    # Event approvals
    path('approvals/', views.EventApprovalListView.as_view(), name='approval_list'),
    path('approvals/<uuid:approval_id>/action/', views.EventApprovalActionView.as_view(), name='approval_action'),
    
    # Event feedback
    path('feedback/', views.EventFeedbackListCreateView.as_view(), name='feedback_list_create'),
    
    # Event media
    path('media/', views.EventMediaListCreateView.as_view(), name='media_list_create'),
]
