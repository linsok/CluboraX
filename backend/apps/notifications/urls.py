from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    # Notifications
    path('', views.NotificationListCreateView.as_view(), name='notification_list_create'),
    path('<uuid:pk>/', views.NotificationDetailView.as_view(), name='notification_detail'),
    path('<uuid:notification_id>/mark-read/', views.NotificationMarkReadView.as_view(), name='notification_mark_read'),
    path('mark-all-read/', views.NotificationMarkAllReadView.as_view(), name='notification_mark_all_read'),
    path('stats/', views.NotificationStatsView.as_view(), name='notification_stats'),
    
    # Notification templates
    path('templates/', views.NotificationTemplateListCreateView.as_view(), name='template_list_create'),
    path('templates/<uuid:pk>/', views.NotificationTemplateDetailView.as_view(), name='template_detail'),
    
    # Notification preferences
    path('preferences/', views.NotificationPreferenceView.as_view(), name='notification_preferences'),
    
    # Bulk notifications
    path('bulk/', views.BulkNotificationListCreateView.as_view(), name='bulk_notification_list_create'),
    path('bulk/<uuid:pk>/', views.BulkNotificationDetailView.as_view(), name='bulk_notification_detail'),
    path('bulk/<uuid:notification_id>/send/', views.BulkNotificationSendView.as_view(), name='bulk_notification_send'),
    
    # Delivery logs
    path('delivery-logs/', views.NotificationDeliveryLogListView.as_view(), name='delivery_log_list'),
]
