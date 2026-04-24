import qrcode
import qrcode.constants
from io import BytesIO
from django.core.files import File
from django.utils import timezone
from datetime import timedelta
import uuid
try:
    import magic
    MAGIC_AVAILABLE = True
except ImportError:
    MAGIC_AVAILABLE = False
    magic = None
from PIL import Image
try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def generate_qr_code(data, size=10, border=4):
    """
    Generate QR code for given data.
    
    Args:
        data (str): Data to encode in QR code
        size (int): QR code size
        border (int): QR code border size
    
    Returns:
        File: QR code image file
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=size,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to file object
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return File(buffer, name=f'qr_{uuid.uuid4()}.png')


def validate_image_file(file):
    """
    Validate uploaded image file.
    
    Args:
        file: Uploaded file object
    
    Returns:
        tuple: (is_valid, error_message)
    """
    # Check file size
    if file.size > settings.MAX_IMAGE_SIZE:
        return False, f"Image size must be less than {settings.MAX_IMAGE_SIZE // (1024*1024)}MB"
    
    # Check file type
    file_type = magic.from_buffer(file.read(1024), mime=True)
    file.seek(0)
    
    if file_type not in settings.IMAGE_UPLOAD_TYPES:
        return False, f"Invalid image type. Allowed types: {', '.join(settings.IMAGE_UPLOAD_TYPES)}"
    
    # Try to open with PIL to verify it's a valid image
    try:
        Image.open(file)
        file.seek(0)
    except Exception as e:
        logger.error(f"Image validation error: {e}")
        return False, "Invalid image file"
    
    return True, None


def resize_image(image_path, max_width=800, max_height=800, quality=85):
    """
    Resize image to specified dimensions while maintaining aspect ratio.
    
    Args:
        image_path (str): Path to image file
        max_width (int): Maximum width
        max_height (int): Maximum height
        quality (int): JPEG quality (1-100)
    
    Returns:
        str: Path to resized image
    """
    try:
        img = Image.open(image_path)
        
        # Calculate new dimensions
        ratio = min(max_width / img.width, max_height / img.height)
        new_width = int(img.width * ratio)
        new_height = int(img.height * ratio)
        
        # Resize image
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Save resized image
        resized_path = image_path.replace('.', '_resized.')
        img.save(resized_path, quality=quality, optimize=True)
        
        return resized_path
    except Exception as e:
        logger.error(f"Image resize error: {e}")
        return image_path


def detect_faces(image_path):
    """
    Detect faces in an image using OpenCV.
    
    Args:
        image_path (str): Path to image file
    
    Returns:
        list: List of face coordinates
    """
    if not CV2_AVAILABLE:
        return []
    
    try:
        # Load the cascade classifier
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Read the image
        img = cv2.imread(image_path)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        return faces.tolist()
    except Exception as e:
        logger.error(f"Face detection error: {e}")
        return []


def extract_text_from_image(image_path):
    """
    Extract text from image using OCR (placeholder for actual OCR implementation).
    
    Args:
        image_path (str): Path to image file
    
    Returns:
        str: Extracted text
    """
    # This is a placeholder for OCR implementation
    # In production, you would use Tesseract, DeepSeek OCR, or similar
    try:
        # Load image
        img = cv2.imread(image_path)
        
        # Preprocess image for better OCR
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply threshold to get binary image
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Here you would call your OCR service
        # For now, return a placeholder
        return "OCR extraction not implemented yet"
    except Exception as e:
        logger.error(f"OCR extraction error: {e}")
        return ""


def generate_unique_filename(original_filename):
    """
    Generate unique filename to avoid conflicts.
    
    Args:
        original_filename (str): Original filename
    
    Returns:
        str: Unique filename
    """
    import os
    name, ext = os.path.splitext(original_filename)
    unique_id = uuid.uuid4().hex[:8]
    return f"{name}_{unique_id}{ext}"


def calculate_revenue_split(total_amount, club_percentage=50):
    """
    Calculate revenue split between club and university.
    
    Args:
        total_amount (decimal): Total amount
        club_percentage (int): Percentage for club (default: 50)
    
    Returns:
        dict: Revenue split details
    """
    club_amount = total_amount * (club_percentage / 100)
    university_amount = total_amount - club_amount
    
    return {
        'total_amount': total_amount,
        'club_percentage': club_percentage,
        'club_amount': club_amount,
        'university_amount': university_amount,
        'university_percentage': 100 - club_percentage
    }


def format_currency(amount, currency='KHR'):
    """
    Format currency amount.
    
    Args:
        amount (decimal): Amount to format
        currency (str): Currency code
    
    Returns:
        str: Formatted currency string
    """
    if currency == 'KHR':
        return f"៛{amount:,.0f}"
    elif currency == 'USD':
        return f"${amount:,.2f}"
    else:
        return f"{amount:,.2f} {currency}"


def is_qr_code_expired(qr_created_at, expiry_hours=None):
    """
    Check if QR code has expired.
    
    Args:
        qr_created_at (datetime): QR code creation time
        expiry_hours (int): Expiry hours (default from settings)
    
    Returns:
        bool: True if expired
    """
    if expiry_hours is None:
        expiry_hours = settings.QR_CODE_EXPIRY_HOURS
    
    expiry_time = qr_created_at + timedelta(hours=expiry_hours)
    return timezone.now() > expiry_time


def send_notification(user, title, message, notification_type='system', priority='medium'):
    """
    Send notification to user (placeholder for actual notification implementation).
    
    Args:
        user: User object
        title (str): Notification title
        message (str): Notification message
        notification_type (str): Type of notification
        priority (str): Notification priority (low, medium, high)
    
    Returns:
        bool: True if successful
    """
    try:
        from apps.notifications.models import Notification
        
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            type=notification_type,
            priority=priority
        )
        
        # Here you would also send email/push notification
        # send_email_notification(user, title, message)
        # send_push_notification(user, title, message)
        
        return True
    except Exception as e:
        logger.error(f"Notification send error: {e}")
        return False


def validate_student_id(student_id):
    """
    Validate student ID format.
    
    Args:
        student_id (str): Student ID to validate
    
    Returns:
        tuple: (is_valid, error_message)
    """
    if not student_id:
        return False, "Student ID is required"
    
    # Add your validation logic here
    # Example: Check format, length, etc.
    if len(student_id) < 5:
        return False, "Student ID must be at least 5 characters"
    
    return True, None


def get_client_ip(request):
    """
    Get client IP address from request.
    
    Args:
        request: Django request object
    
    Returns:
        str: Client IP address
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_user_action(request, action, table_name, record_id, old_values=None, new_values=None):
    """
    Log user action for audit purposes.
    
    Args:
        request: Django request object
        action (str): Action performed
        table_name (str): Table name
        record_id (str): Record ID
        old_values (dict): Old values
        new_values (dict): New values
    """
    try:
        from apps.core.models import AuditLog
        
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action=action,
            table_name=table_name,
            record_id=str(record_id),
            old_values=old_values,
            new_values=new_values,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
    except Exception as e:
        logger.error(f"Audit log error: {e}")
