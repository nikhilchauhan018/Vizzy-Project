from django.urls import path
from apps.jobs.views import (
    JobGenerateView,
    JobDetailView,
    ActiveJobsView,
)

urlpatterns = [
    path('generate/', JobGenerateView.as_view(), name='job-generate'),
    path('active/', ActiveJobsView.as_view(), name='job-active'),
    path('<uuid:job_id>/', JobDetailView.as_view(), name='job-detail'),
]
