from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, QueueViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'queues', QueueViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
