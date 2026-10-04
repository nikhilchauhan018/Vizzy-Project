from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication

User = get_user_model()


class DevelopmentAuthentication(authentication.BaseAuthentication):
    """
    Development-only authentication mechanism.
    Allows requests carrying `Authorization: Bearer dev-token` to authenticate
    as the active local development user strictly when settings.DEBUG is True.
    In production (DEBUG=False), this authenticator returns None (inoperative)
    so standard production authenticators handle authorization.
    """

    def authenticate(self, request):
        if not getattr(settings, 'DEBUG', False):
            return None

        auth_header = request.headers.get('Authorization', '')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        token = parts[1]
        if token != 'dev-token':
            return None

        user, _ = User.objects.get_or_create(
            email='developer@vizzy.studio',
            defaults={
                'first_name': 'Vizzy',
                'last_name': 'Developer',
                'is_active': True,
            },
        )
        return (user, None)

    def authenticate_header(self, request):
        return 'Bearer'
