from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import login, logout
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.http import HttpResponse
from .models import User, UserProfile, PasswordResetToken, EmailVerificationToken, UserActivity
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, OTPVerificationSerializer,
    UserProfileSerializer, UserUpdateSerializer, ExtendedUserProfileSerializer,
    ChangePasswordSerializer, TokenSerializer, UserListSerializer,
    PasswordResetSerializer, PasswordResetConfirmSerializer,
    EmailVerificationSerializer, UserActivitySerializer
)
from .authentication import generate_jwt_token, refresh_jwt_token
from apps.core.permissions import IsOwnerOrAdmin, IsAdminUser
from apps.core.utils import send_notification, get_client_ip, log_user_action
import logging

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    """
    User registration endpoint.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Register a new user.
        """
        try:
            serializer = UserRegistrationSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                
                # Log user activity
                log_user_action(request, 'create', 'User', user.id, new_values=serializer.data)
                
                # Auto-verify user in development
                from django.conf import settings
                if settings.DEBUG:
                    user.is_verified = True
                    user.save()
                    
                    # Generate JWT token for immediate login
                    token = generate_jwt_token(user)
                    
                    return Response({
                        'success': True,
                        'message': 'Registration successful! You are now logged in.',
                        'data': {
                            'access_token': token,
                            'user': UserProfileSerializer(user, context={'request': request}).data,
                            'requires_verification': False
                        }
                    }, status=status.HTTP_201_CREATED)
                else:
                    # Send verification email in production
                    self.send_verification_email(user)
                    
                    return Response({
                        'success': True,
                        'message': 'Registration successful. Please check your email for verification.',
                        'data': {
                            'user_id': str(user.id),
                            'email': user.email,
                            'requires_verification': True
                        }
                    }, status=status.HTTP_201_CREATED)
            
            return Response({
                'error': True,
                'message': 'Registration failed',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return Response({
                'error': True,
                'message': 'Registration failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def send_verification_email(self, user):
        """
        Send verification email to user.
        """
        try:
            verification_token = EmailVerificationToken.objects.get(user=user, is_used=False)
            
            subject = 'Verify Your Email Address'
            message = f'''
            Hi {user.first_name},
            
            Please verify your email address by using the OTP code: {user.otp_code}
            
            Or click the link below:
            {settings.FRONTEND_URL}/verify-email/{verification_token.token}
            
            This code will expire in 10 minutes.
            
            Thanks,
            Campus Management Team
            '''
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False
            )
            
        except Exception as e:
            logger.error(f"Verification email error: {e}")


class LoginView(APIView):
    """
    User login endpoint.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Login user and return JWT token.
        """
        try:
            serializer = UserLoginSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.validated_data['user']
                
                # Check if user is verified
                if not user.is_verified:
                    return Response({
                        'error': True,
                        'message': 'Please verify your email address first.',
                        'requires_verification': True
                    }, status=status.HTTP_401_UNAUTHORIZED)
                
                # Generate JWT token
                token = generate_jwt_token(user)
                
                # Update last login and IP
                user.last_login = timezone.now()
                user.last_login_ip = get_client_ip(request)
                user.save(update_fields=['last_login', 'last_login_ip'])
                
                # Log user activity
                log_user_action(request, 'login', 'User', user.id)
                
                # Create user activity record
                UserActivity.objects.create(
                    user=user,
                    activity_type='login',
                    description='User logged in',
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                # Send notification
                send_notification(user, 'Login Alert', 'You logged into your account', 'system')
                
                return Response({
                    'success': True,
                    'message': 'Login successful',
                    'data': {
                        'access_token': token,
                        'user': UserProfileSerializer(user, context={'request': request}).data,
                        'expires_in': getattr(settings, 'JWT_EXPIRATION_DELTA', 86400)
                    }
                })
            
            return Response({
                'error': True,
                'message': 'Login failed',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Login error: {e}")
            return Response({
                'error': True,
                'message': 'Login failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyOTPView(APIView):
    """
    OTP verification endpoint.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Verify OTP code.
        """
        try:
            serializer = OTPVerificationSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.validated_data['user']
                
                # Generate JWT token
                token = generate_jwt_token(user)
                
                # Log user activity
                log_user_action(request, 'verify', 'User', user.id)
                
                return Response({
                    'success': True,
                    'message': 'Email verified successfully',
                    'data': {
                        'access_token': token,
                        'user': UserProfileSerializer(user, context={'request': request}).data
                    }
                })
            
            return Response({
                'error': True,
                'message': 'OTP verification failed',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"OTP verification error: {e}")
            return Response({
                'error': True,
                'message': 'OTP verification failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyEmailView(APIView):
    """
    Email verification endpoint.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Verify email using token.
        """
        try:
            serializer = EmailVerificationSerializer(data=request.data)
            if serializer.is_valid():
                verification_token = serializer.validated_data['token']
                user = verification_token.user
                
                # Mark token as used
                verification_token.is_used = True
                verification_token.save()
                
                # Verify user
                user.is_verified = True
                user.save(update_fields=['is_verified'])
                
                # Generate JWT token
                token = generate_jwt_token(user)
                
                # Log user activity
                log_user_action(request, 'verify', 'User', user.id)
                
                return Response({
                    'success': True,
                    'message': 'Email verified successfully',
                    'data': {
                        'access_token': token,
                        'user': UserProfileSerializer(user, context={'request': request}).data
                    }
                })
            
            return Response({
                'error': True,
                'message': 'Email verification failed',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Email verification error: {e}")
            return Response({
                'error': True,
                'message': 'Email verification failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LogoutView(APIView):
    """
    User logout endpoint.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Logout user.
        """
        try:
            # Log user activity
            log_user_action(request, 'logout', 'User', request.user.id)
            
            # Create user activity record
            UserActivity.objects.create(
                user=request.user,
                activity_type='logout',
                description='User logged out',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'success': True,
                'message': 'Logout successful'
            })
            
        except Exception as e:
            logger.error(f"Logout error: {e}")
            return Response({
                'error': True,
                'message': 'Logout failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    User profile view.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        """
        Update user profile.
        """
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            if 'profile_picture' in request.data:
                serializer = UserUpdateSerializer(instance, data=request.data, partial=partial)
            else:
                serializer = UserProfileSerializer(instance, data=request.data, partial=partial)
            
            if serializer.is_valid():
                user = serializer.save()
                
                # Log user activity
                log_user_action(request, 'update', 'User', user.id, new_values=serializer.data)
                
                return Response({
                    'success': True,
                    'message': 'Profile updated successfully',
                    'data': serializer.data
                })
            
            return Response({
                'error': True,
                'message': 'Profile update failed',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Profile update error: {e}")
            return Response({
                'error': True,
                'message': 'Profile update failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExtendedProfileView(generics.RetrieveUpdateAPIView):
    """
    Extended user profile view.
    """
    serializer_class = ExtendedUserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


class ChangePasswordView(APIView):
    """
    Change password endpoint.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Change user password.
        """
        try:
            serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                user = request.user
                
                # Set new password
                user.set_password(serializer.validated_data['new_password'])
                user.password_changed_at = timezone.now()
                user.save()
                
                # Log user activity
                log_user_action(request, 'change_password', 'User', user.id)
                
                # Send notification
                send_notification(user, 'Password Changed', 'Your password was changed successfully', 'security')
                
                return Response({
                    'success': True,
                    'message': 'Password changed successfully'
                })
            
            return Response({
                'error': True,
                'message': 'Password change failed',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Password change error: {e}")
            return Response({
                'error': True,
                'message': 'Password change failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasswordResetView(APIView):
    """
    Password reset endpoint.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Send password reset email.
        """
        try:
            serializer = PasswordResetSerializer(data=request.data)
            if serializer.is_valid():
                email = serializer.validated_data['email']
                user = User.objects.get(email=email)
                
                # Generate reset token
                reset_token = PasswordResetToken.generate_token(user)
                
                # Send reset email
                self.send_reset_email(user, reset_token)
                
                return Response({
                    'success': True,
                    'message': 'Password reset email sent'
                })
            
            return Response({
                'error': True,
                'message': 'Password reset failed',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Password reset error: {e}")
            return Response({
                'error': True,
                'message': 'Password reset failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def send_reset_email(self, user, reset_token):
        """
        Send password reset email.
        """
        try:
            subject = 'Reset Your Password'
            message = f'''
            Hi {user.first_name},
            
            Please click the link below to reset your password:
            {settings.FRONTEND_URL}/reset-password/{reset_token.token}
            
            This link will expire in 1 hour.
            
            Thanks,
            Campus Management Team
            '''
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False
            )
            
        except Exception as e:
            logger.error(f"Reset email error: {e}")


class PasswordResetConfirmView(APIView):
    """
    Password reset confirmation endpoint.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Reset password using token.
        """
        try:
            serializer = PasswordResetConfirmSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.validated_data['user']
                reset_token = serializer.validated_data['reset_token']
                new_password = serializer.validated_data['new_password']
                
                # Set new password
                user.set_password(new_password)
                user.password_changed_at = timezone.now()
                user.save()
                
                # Mark token as used
                reset_token.is_used = True
                reset_token.save()
                
                # Log user activity
                log_user_action(request, 'reset_password', 'User', user.id)
                
                # Send notification
                send_notification(user, 'Password Reset', 'Your password was reset successfully', 'security')
                
                return Response({
                    'success': True,
                    'message': 'Password reset successful'
                })
            
            return Response({
                'error': True,
                'message': 'Password reset failed',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Password reset confirm error: {e}")
            return Response({
                'error': True,
                'message': 'Password reset failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefreshTokenView(APIView):
    """
    Refresh JWT token endpoint.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Refresh JWT token.
        """
        try:
            # Get current token from Authorization header
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                current_token = auth_header[7:]
                
                # Refresh token
                new_token = refresh_jwt_token(current_token)
                
                return Response({
                    'success': True,
                    'message': 'Token refreshed successfully',
                    'data': {
                        'access_token': new_token,
                        'expires_in': getattr(settings, 'JWT_EXPIRATION_DELTA', 86400)
                    }
                })
            
            return Response({
                'error': True,
                'message': 'No token provided'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            return Response({
                'error': True,
                'message': 'Token refresh failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserListView(generics.ListAPIView):
    """
    User list view (admin only).
    """
    serializer_class = UserListSerializer
    permission_classes = [IsAdminUser]
    queryset = User.objects.all().order_by('-date_joined')
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by role
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by verification status
        is_verified = self.request.query_params.get('is_verified')
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')
        
        return queryset


class UserActivityView(generics.ListAPIView):
    """
    User activity view.
    """
    serializer_class = UserActivitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserActivity.objects.filter(user=self.request.user).order_by('-timestamp')


class OAuthCallbackView(APIView):
    """
    Google OAuth callback endpoint.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    
    def get(self, request):
        """
        Handle Google OAuth callback (GET request).
        """
        try:
            logger.info(f"OAuth callback called with path: {request.path}")
            
            # Disconnect signals to avoid serialization issues during OAuth
            from django.db.models.signals import post_save
            from django.contrib.auth.signals import user_logged_in
            from .signals import save_user_profile, create_user_profile
            from .models import User
            
            post_save.disconnect(save_user_profile, sender=User)
            post_save.disconnect(create_user_profile, sender=User)
            
            from django.conf import settings
            from .models import User
            from .authentication import generate_jwt_token
            import requests
            import json
            import urllib.parse
            
            code = request.GET.get('code')
            logger.info(f"Authorization code received: {code[:20] if code else 'None'}...")
            
            if not code:
                return Response({
                    'error': 'Authorization code is required'
                }, status=400)
            
            # Exchange code for access token
            token_url = 'https://oauth2.googleapis.com/token'
            
            # Determine the correct redirect URI based on the request path
            if '/oauth/callback/' in request.path:
                redirect_uri = request.build_absolute_uri('/api/users/oauth/callback/')
            else:
                redirect_uri = request.build_absolute_uri('/api/users/google/callback/')
            
            logger.info(f"Using redirect URI: {redirect_uri}")
            
            token_data = {
                'code': code,
                'client_id': settings.GOOGLE_OAUTH2_CLIENT_ID,
                'client_secret': settings.GOOGLE_OAUTH2_CLIENT_SECRET,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code'
            }
            
            logger.info(f"Token exchange data: {token_data}")
            token_response = requests.post(token_url, data=token_data)
            logger.info(f"Token exchange response status: {token_response.status_code}")
            
            if token_response.status_code != 200:
                return Response({
                    'error': 'Failed to exchange code for token',
                    'details': token_response.text
                }, status=400)
            
            token_info = token_response.json()
            access_token = token_info.get('access_token')
            
            # Get user info from Google
            user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
            headers = {'Authorization': f'Bearer {access_token}'}
            user_response = requests.get(user_info_url, headers=headers)
            
            if user_response.status_code != 200:
                return Response({
                    'error': 'Failed to get user info from Google'
                }, status=400)
            
            user_info = user_response.json()
            
            # Find or create user
            email = user_info.get('email')
            if not email:
                return Response({
                    'error': 'Email is required from Google'
                }, status=400)
            
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,
                    'first_name': user_info.get('given_name', ''),
                    'last_name': user_info.get('family_name', ''),
                    'is_verified': True,
                    'role': 'student'
                }
            )
            
            if not created:
                # Update existing user with Google info
                user.first_name = user_info.get('given_name', user.first_name)
                user.last_name = user_info.get('family_name', user.last_name)
                user.is_verified = True
                user.save()
            
            # Generate JWT token
            token = generate_jwt_token(user)
            
            # Use serializer for proper JSON serialization
            from .serializers import UserProfileSerializer
            serializer = UserProfileSerializer(user, context={'request': request})
            user_data = serializer.data
            user_data['is_new_user'] = created
            
            # Return HTML page with token for frontend
            html_response = f"""
            <html>
            <head>
                <title>Google Sign-In Success</title>
            </head>
            <body>
                <h1>Successfully signed in with Google!</h1>
                <p>You will be redirected automatically...</p>
                <script>
                    // Send token to parent window or store in localStorage
                    const token = '{token}';
                    const user = {json.dumps(user_data)};
                    
                    // Store in localStorage for immediate access
                    localStorage.setItem('access_token', token);
                    localStorage.setItem('user', JSON.stringify(user));
                    
                    // Store user data for profile completion
                    localStorage.setItem('google_signup_data', JSON.stringify({
                        user: user,
                        is_new_user: {str(created).lower()}
                    }));
                    
                    // Redirect to frontend Google callback handler with URL parameters
                    setTimeout(function(){
                        // Notify parent window (for popup flow)
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'OAUTH_SUCCESS',
                                token: token,
                                user: user
                            }, '*');
                            window.close();
                        } else {
                            // Redirect with token and user as URL parameters as fallback
                            window.location.href = '{settings.FRONTEND_URL}/auth/google/callback?token=' + encodeURIComponent(token) + '&user=' + encodeURIComponent(JSON.stringify(user));
                        }
                    }, 500);
                </script>
            </body>
            </html>
            """
            
            return HttpResponse(html_response, content_type='text/html')
            
        except Exception as e:
            logger.error(f"Google OAuth callback error: {e}")
            return Response({
                'error': 'Internal server error during OAuth callback'
            }, status=500)
