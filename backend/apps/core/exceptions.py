from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.http import Http404
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Customize the error response
        custom_response_data = {
            'error': True,
            'message': response.data.get('detail', str(exc)),
            'status_code': response.status_code,
            'data': None
        }

        # Handle specific error types
        if isinstance(exc, Http404):
            custom_response_data['message'] = 'Resource not found'
        elif hasattr(exc, 'default_detail'):
            custom_response_data['message'] = exc.default_detail

        response.data = custom_response_data

    return response


class CustomAPIException(Exception):
    """
    Base custom API exception.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'A server error occurred.'

    def __init__(self, detail=None, status_code=None, field=None):
        self.detail = detail or self.default_detail
        if status_code is not None:
            self.status_code = status_code
        self.field = field
        super().__init__(detail)


class ValidationError(CustomAPIException):
    """
    Validation error exception.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid input.'


class NotFoundError(CustomAPIException):
    """
    Not found error exception.
    """
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Resource not found.'


class PermissionDenied(CustomAPIException):
    """
    Permission denied exception.
    """
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'Permission denied.'


class AuthenticationFailed(CustomAPIException):
    """
    Authentication failed exception.
    """
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication failed.'


class RateLimitExceeded(CustomAPIException):
    """
    Rate limit exceeded exception.
    """
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Rate limit exceeded.'


class ServiceUnavailable(CustomAPIException):
    """
    Service unavailable exception.
    """
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'Service temporarily unavailable.'


class PaymentError(CustomAPIException):
    """
    Payment processing error.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Payment processing failed.'


class QRCodeExpired(CustomAPIException):
    """
    QR code expired exception.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'QR code has expired.'


class EventFullError(CustomAPIException):
    """
    Event is full exception.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Event is fully booked.'


class RegistrationClosedError(CustomAPIException):
    """
    Registration closed exception.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Registration for this event has closed.'


class ClubMembershipError(CustomAPIException):
    """
    Club membership error.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Club membership error.'


class DuplicateRegistrationError(CustomAPIException):
    """
    Duplicate registration error.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Already registered for this event.'


class InvalidFileError(CustomAPIException):
    """
    Invalid file error.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid file format or size.'


class AIProcessingError(CustomAPIException):
    """
    AI processing error.
    """
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'AI processing failed.'


class EmailSendError(CustomAPIException):
    """
    Email send error.
    """
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'Failed to send email.'


class DatabaseError(CustomAPIException):
    """
    Database error.
    """
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'Database operation failed.'


class ConfigurationError(CustomAPIException):
    """
    Configuration error.
    """
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'System configuration error.'
