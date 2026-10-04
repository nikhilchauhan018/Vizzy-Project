from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name']
        read_only_fields = ['id', 'email', 'full_name']


class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    full_name = serializers.CharField(required=True, allow_blank=False, max_length=150)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8,
    )

    def validate_email(self, value):
        cleaned = value.strip().lower()
        if not cleaned:
            raise serializers.ValidationError("Email address cannot be blank.")
        if User.objects.filter(email__iexact=cleaned).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return cleaned

    def validate_full_name(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Full name cannot be blank.")
        return cleaned

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

    def create(self, validated_data):
        email = validated_data['email'].strip().lower()
        full_name = validated_data['full_name'].strip()
        password = validated_data['password']

        parts = full_name.split(' ', 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ''

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')

        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")

        user = None
        try:
            candidate = User.objects.get(email__iexact=email)
            if candidate.check_password(password):
                user = candidate
        except User.DoesNotExist:
            user = None
        except User.MultipleObjectsReturned:
            for c in User.objects.filter(email__iexact=email):
                if c.check_password(password):
                    user = c
                    break

        if not user:
            raise serializers.ValidationError("Invalid credentials. Please verify your email and password.")

        if not user.is_active:
            raise serializers.ValidationError("This user account is inactive.")

        attrs['user'] = user
        return attrs
