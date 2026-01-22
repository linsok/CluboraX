import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions
from rest_framework.authentication import BaseAuthentication
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class JWTAuthentication(BaseAuthentication):
    """
    Custom JWT authentication class.
    """
    
    def authenticate(self, request):
        """
        Authenticate the request and return a two-tuple of (user, token).
        """
        auth_header = authentication.get_authorization_header(request).split()
        
        if not auth_header or auth_header[0].lower() != b'bearer':
            return None
        
        if len(auth_header) == 1:
            raise exceptions.AuthenticationFailed('Invalid token header. No credentials provided.')
        elif len(auth_header) > 2:
            raise exceptions.AuthenticationFailed('Invalid token header. Token string should not contain spaces.')
        
        try:
            token = auth_header[1].decode('utf-8')
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired.')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token.')
        except Exception as e:
            logger.error(f"JWT decode error: {e}")
            raise exceptions.AuthenticationFailed('Token authentication failed.')
        
        user_id = payload.get('user_id')
        if not user_id:
            raise exceptions.AuthenticationFailed('Token payload invalid.')
        
        try:
            user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User not found.')
        
        # Check if token was issued before password change
        if hasattr(user, 'password_changed_at'):
            token_issued_at = timezone.datetime.fromtimestamp(
                payload.get('iat'), 
                tz=timezone.utc
            )
            if user.password_changed_at and token_issued_at < user.password_changed_at:
                raise exceptions.AuthenticationFailed('Token has been invalidated.')
        
        return (user, token)
    
    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the `WWW-Authenticate`
        header in a `401 Unauthenticated` response.
        """
        return 'Bearer'


class OTPAuthentication(BaseAuthentication):
    """
    OTP-based authentication for email verification.
    """
    
    def authenticate(self, request):
        """
        Authenticate using OTP code.
        """
        email = request.data.get('email')
        otp_code = request.data.get('otp_code')
        
        if not email or not otp_code:
            return None
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid credentials.')
        
        if not user.verify_otp(otp_code):
            raise exceptions.AuthenticationFailed('Invalid or expired OTP.')
        
        return (user, None)


class SessionAuthentication(BaseAuthentication):
    """
    Session-based authentication for web interface.
    """
    
    def authenticate(self, request):
        """
        Authenticate using Django session.
        """
        user = getattr(request, 'user', None)
        
        if not user or not user.is_authenticated:
            return None
        
        # Update last login and IP
        user.last_login = timezone.now()
        user.last_login_ip = self.get_client_ip(request)
        user.save(update_fields=['last_login', 'last_login_ip'])
        
        return (user, None)
    
    def get_client_ip(self, request):
        """
        Get client IP address.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


def generate_jwt_token(user):
    """
    Generate JWT token for user.
    """
    payload = {
        'user_id': str(user.id),
        'email': user.email,
        'role': user.role,
        'iat': timezone.now().timestamp(),
        'exp': (timezone.now() + timezone.timedelta(seconds=getattr(settings, 'JWT_EXPIRATION_DELTA', 86400))).timestamp()
    }
    
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    return token


def refresh_jwt_token(token):
    """
    Refresh JWT token.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get('user_id')
        
        user = User.objects.get(id=user_id, is_active=True)
        
        return generate_jwt_token(user)
    except jwt.ExpiredSignatureError:
        raise exceptions.AuthenticationFailed('Token has expired and cannot be refreshed.')
    except jwt.InvalidTokenError:
        raise exceptions.AuthenticationFailed('Invalid token.')
    except User.DoesNotExist:
        raise exceptions.AuthenticationFailed('User not found.')


def verify_jwt_token(token):
    """
    Verify JWT token without authentication.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise exceptions.AuthenticationFailed('Token has expired.')
    except jwt.InvalidTokenError:
        raise exceptions.AuthenticationFailed('Invalid token.')
