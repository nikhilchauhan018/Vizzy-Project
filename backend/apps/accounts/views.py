from django.contrib.auth import logout
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from .serializers import UserSerializer, SignupSerializer, LoginSerializer


class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                'token': token.key,
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if 'username' in request.data and 'email' not in request.data:
            return Response(
                {
                    'detail': 'Login with username is not supported. Please use email and password.',
                    'email': ['This field is required.'],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LoginSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            errors = serializer.errors
            err_msg = "Invalid credentials. Please verify your email and password."
            if 'non_field_errors' in errors and errors['non_field_errors']:
                err_msg = str(errors['non_field_errors'][0])
            elif 'detail' in errors and errors['detail']:
                err_msg = str(errors['detail'][0])
            elif 'email' in errors and errors['email']:
                err_msg = str(errors['email'][0])
            elif isinstance(errors, dict) and errors:
                first_key = next(iter(errors))
                val = errors[first_key]
                err_msg = f"{first_key}: {val[0] if isinstance(val, list) else val}"

            resp_data = {'detail': err_msg}
            if 'email' in errors:
                resp_data['email'] = errors['email']
            return Response(resp_data, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                'token': token.key,
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, 'auth_token') and request.user.auth_token:
            request.user.auth_token.delete()
        try:
            logout(request)
        except Exception:
            pass
        return Response(
            {'detail': 'Successfully logged out.'},
            status=status.HTTP_200_OK,
        )


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)
