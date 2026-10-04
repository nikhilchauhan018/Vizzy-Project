from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/stories/', include('apps.stories.urls')),
    path('api/ai/', include('apps.providers.urls')),
    path('api/jobs/', include('apps.jobs.urls')),
]
