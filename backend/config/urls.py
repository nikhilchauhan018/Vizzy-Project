from django.contrib import admin
from django.urls import path, include
from apps.core.views import HealthCheckView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('healthz', HealthCheckView.as_view(), name='healthz'),
    path('api/health/', HealthCheckView.as_view(), name='api-health'),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/stories/', include('apps.stories.urls')),
    path('api/ai/', include('apps.providers.urls')),
    path('api/jobs/', include('apps.jobs.urls')),
]
