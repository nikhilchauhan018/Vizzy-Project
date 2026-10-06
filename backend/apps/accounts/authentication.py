from django.conf import settings
from rest_framework.authentication import TokenAuthentication, get_authorization_header
from rest_framework import exceptions


class BearerTokenAuthentication(TokenAuthentication):
    """
    Accepts both `Authorization: Bearer <token>` and `Authorization: Token <token>`.
    If the token is 'dev-token', yields to DevelopmentAuthentication (active in DEBUG only).
    """
    keyword = 'Bearer'

    def authenticate(self, request):
        raw_header = get_authorization_header(request)
        if not raw_header:
            auth_val = (
                getattr(request, 'headers', {}).get('Authorization')
                or request.META.get('HTTP_AUTHORIZATION')
                or request.META.get('AUTHORIZATION')
            )
            if auth_val:
                raw_header = auth_val.encode('iso-8859-1') if isinstance(auth_val, str) else auth_val

        has_auth = bool(raw_header)
        auth_parts = raw_header.split() if has_auth else []
        scheme = auth_parts[0].decode('iso-8859-1') if auth_parts else 'None'

        if getattr(settings, 'DEBUG', False):
            path = getattr(request, 'path', 'unknown')
            print(f"AUTH DEBUG DJANGO: path = {path}, hasAuthorizationHeader = {has_auth}, scheme = {scheme}")

        if not raw_header:
            return None

        if len(auth_parts) != 2:
            return None

        if scheme.lower() not in ('bearer', 'token'):
            return None

        try:
            token_key = auth_parts[1].decode('iso-8859-1')
        except UnicodeError:
            raise exceptions.AuthenticationFailed('Invalid token header. Token string should contain valid characters.')

        if token_key == 'dev-token':
            return None

        user_auth_tuple = self.authenticate_credentials(token_key)
        if user_auth_tuple and getattr(settings, 'DEBUG', False):
            user, _ = user_auth_tuple
            print(f"AUTH DEBUG DJANGO: authenticated user email = {user.email}")
        return user_auth_tuple

    def authenticate_header(self, request):
        return 'Bearer'
