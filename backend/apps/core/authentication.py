from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication
from rest_framework.authentication import get_authorization_header

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

        raw_header = get_authorization_header(request)
        if not raw_header:
            auth_val = (
                getattr(request, 'headers', {}).get('Authorization')
                or request.META.get('HTTP_AUTHORIZATION')
                or request.META.get('AUTHORIZATION')
            )
            if auth_val:
                raw_header = auth_val.encode('iso-8859-1') if isinstance(auth_val, str) else auth_val

        if not raw_header:
            return None

        parts = raw_header.split()
        if len(parts) != 2 or parts[0].lower() != b'bearer':
            return None

        try:
            token = parts[1].decode('iso-8859-1')
        except UnicodeError:
            return None

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
