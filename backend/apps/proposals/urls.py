from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'events', views.EventProposalViewSet, basename='event-proposal')
router.register(r'clubs', views.ClubProposalViewSet, basename='club-proposal')

urlpatterns = [
    path('', include(router.urls)),
]
