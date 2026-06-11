from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.utils import timezone
from datetime import datetime
from .models import User, UserProfile
from .serializers_registration import UserRegistrationSerializer
import traceback


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def upload_id_card(request):
    """
    Step 1: Upload and process Cambodian National ID card
    """
    try:
        # Get uploaded image
        if 'id_card_image' not in request.FILES:
            return Response({
                'success': False,
                'message': 'Please upload your ID card image'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        id_card_image = request.FILES['id_card_image']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png']
        if id_card_image.content_type not in allowed_types:
            return Response({
                'success': False,
                'message': 'Only JPG, JPEG, and PNG images are allowed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 5MB)
        if id_card_image.size > 5 * 1024 * 1024:
            return Response({
                'success': False,
                'message': 'Image size must be less than 5MB'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Process with OCR
        from .ocr_service import OCRService
        ocr_service = OCRService()
        ocr_result = ocr_service.process_id_card(id_card_image)
        
        if not ocr_result['success']:
            return Response({
                'success': False,
                'message': ocr_result['message'],
                'error': ocr_result.get('error', 'Unknown error')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Store extracted data in session for next step
        request.session['registration_data'] = {
            'extracted_data': ocr_result['data'],
            'id_card_image_path': ocr_result['data']['id_card_image_path']
        }
        
        return Response({
            'success': True,
            'message': 'ID card processed successfully',
            'data': ocr_result['data']
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print("UPLOAD ID CARD ERROR:")
        print(traceback.format_exc())
        return Response({
            "success": False,
            "error": str(e),
            "message": "Failed to upload/process ID card"
        }, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_registration_data(request):
    """
    Get stored registration data from session
    """
    registration_data = request.session.get('registration_data', {})
    
    if not registration_data:
        return Response({
            'success': False,
            'message': 'No registration data found. Please upload your ID card first.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'success': True,
        'data': registration_data
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_account(request):
    """
    Step 2: Create account with email and password
    """
    try:
        # Check if registration data exists in session
        registration_data = request.session.get('registration_data', {})

        if registration_data:
            extracted_data = registration_data.get('extracted_data', {})
        else:
            extracted_data = request.data.get('id_card_data', {})

        if not extracted_data:
            return Response({
                'success': False,
                'message': 'Please upload your ID card first'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get form data
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        confirm_password = request.data.get('confirm_password', '')
        
        # Validate email and password
        if not email or not password:
            return Response({
                'success': False,
                'message': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if password != confirm_password:
            return Response({
                'success': False,
                'message': 'Passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 8:
            return Response({
                'success': False,
                'message': 'Password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return Response({
                'success': False,
                'message': 'An account with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get role and academic/org data
        role = request.data.get('role', 'student').lower()
        if role not in ['student', 'organizer']:
            role = 'student'

        university = request.data.get('university', '')
        if university == 'Other':
            university = request.data.get('customUniversity', '')
        major = request.data.get('major', '')
        organization_name = request.data.get('organizationName', '')

        # Set role-specific fields
        student_id = ''
        staff_id = ''
        faculty = ''
        department = ''

        if role == 'student':
            student_id = extracted_data.get('id_number', '')
            faculty = university
            department = major
        elif role == 'organizer':
            staff_id = extracted_data.get('id_number', '')
            department = organization_name
        
        # Parse date of birth
        date_of_birth = None
        if extracted_data.get('date_of_birth'):
            try:
                date_of_birth = datetime.strptime(extracted_data['date_of_birth'], '%m/%d/%Y').date()
            except ValueError:
                pass
        
        # Parse expiry date
        id_card_expiry = None
        if extracted_data.get('expiry_date'):
            try:
                id_card_expiry = datetime.strptime(extracted_data['expiry_date'], '%m/%d/%Y').date()
            except ValueError:
                pass
        
        # Create user
        user = User.objects.create_user(
            email=email,
            username=email,  # Set username to email for Django compatibility and database uniqueness
            password=password,
            first_name=extracted_data.get('name', '').split()[-1] if extracted_data.get('name') else '',
            last_name=' '.join(extracted_data.get('name', '').split()[:-1]) if extracted_data.get('name') else '',
            role=role,
            student_id=student_id,
            staff_id=staff_id,
            faculty=faculty,
            department=department,
            is_verified=True  # Will be verified through email/OTP
        )
        
        # Create or update user profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.date_of_birth = date_of_birth
        profile.gender = extracted_data.get('gender', '')
        
        # Store full OCR data in user preferences JSON field for record keeping
        profile.preferences = {
            **(profile.preferences or {}),
            'ocr_data': extracted_data,
            'id_card_expiry': id_card_expiry.strftime('%Y-%m-%d') if id_card_expiry else None
        }
        profile.save()
        
        # Clear session data
        if 'registration_data' in request.session:
            del request.session['registration_data']
        
        return Response({
            'success': True,
            'message': 'Account created successfully! Please check your email for verification.',
            'user_id': str(user.id)
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'An error occurred while creating your account',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def clear_registration_data(request):
    """
    Clear registration data from session
    """
    if 'registration_data' in request.session:
        del request.session['registration_data']
    
    return Response({
        'success': True,
        'message': 'Registration data cleared'
    }, status=status.HTTP_200_OK)
