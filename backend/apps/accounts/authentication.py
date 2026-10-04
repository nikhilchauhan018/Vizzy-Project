from rest_framework.authentication import TokenAuthentication
from rest_framework import exceptions


class BearerTokenAuthentication(TokenAuthentication):
    """
    Accepts both `Authorization: Bearer <token>` and `Authorization: Token <token>`.
    If the token is 'dev-token', yields to DevelopmentAuthentication (active in DEBUG only).
    """
    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2:
            return None

        scheme = parts[0].lower()
        if scheme not in ('bearer', 'token'):
            return None

        token_key = parts[1]
        if token_key == 'dev-token':
            return None

        return self.authenticate_credentials(token_key)

    def authenticate_header(self, request):
        return 'Bearer'
