from django.urls import path
from . import views

app_name = 'gallery'

urlpatterns = [
    # Galleries
    path('', views.GalleryListCreateView.as_view(), name='gallery_list_create'),
    path('<uuid:pk>/', views.GalleryDetailView.as_view(), name='gallery_detail'),
    
    # Media files
    path('media/', views.MediaFileListCreateView.as_view(), name='media_list_create'),
    path('media/<uuid:pk>/', views.MediaFileDetailView.as_view(), name='media_detail'),
    path('media/<uuid:media_file_id>/like/', views.MediaLikeCreateDestroyView.as_view(), name='media_like'),
    path('media/<uuid:media_file_id>/moderate/', views.MediaModerationView.as_view(), name='media_moderate'),
    
    # Comments
    path('comments/', views.MediaCommentListCreateView.as_view(), name='comment_list_create'),
    
    # Tags
    path('tags/', views.MediaTagListCreateView.as_view(), name='tag_list_create'),
    
    # Collections
    path('collections/', views.MediaCollectionListCreateView.as_view(), name='collection_list_create'),
    
    # Reports
    path('reports/', views.MediaReportListCreateView.as_view(), name='report_list_create'),
    
    # Statistics
    path('stats/', views.MediaStatsView.as_view(), name='media_stats'),
]
