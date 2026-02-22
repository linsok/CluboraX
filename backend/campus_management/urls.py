from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.users.views import PublicStatsView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/admin/', include('apps.admin_panel.urls')),
    path('api/clubs/', include('apps.clubs.urls')),
    path('api/events/', include('apps.events.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/proposals/', include('apps.proposals.urls')),
    # path('api/payments/', include('apps.payments.urls')),  # TODO: Implement payments app
    path('api/gallery/', include('apps.gallery.urls')),
    path('api/stats/public/', PublicStatsView.as_view(), name='public_stats'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
