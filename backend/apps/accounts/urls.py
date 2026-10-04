from django.urls import path
from .views import SignupView, LoginView, LogoutView, CurrentUserView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='account-signup'),
    path('login/', LoginView.as_view(), name='account-login'),
    path('logout/', LogoutView.as_view(), name='account-logout'),
    path('me/', CurrentUserView.as_view(), name='account-me'),
]
