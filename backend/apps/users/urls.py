from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication endpoints
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify_otp'),
    path('verify-email/', views.VerifyEmailView.as_view(), name='verify_email'),
    path('refresh-token/', views.RefreshTokenView.as_view(), name='refresh_token'),
    
    # Password management
    path('password-reset/', views.PasswordResetView.as_view(), name='password_reset'),
    path('password-reset-confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    
    # Profile management
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/extended/', views.ExtendedProfileView.as_view(), name='extended_profile'),
    
    # User management (admin)
    path('list/', views.UserListView.as_view(), name='user_list'),
    path('activity/', views.UserActivityView.as_view(), name='user_activity'),
]
