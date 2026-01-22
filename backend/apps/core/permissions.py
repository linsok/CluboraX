from rest_framework import permissions
from django.contrib.auth.models import AnonymousUser


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        return obj.user == request.user


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to edit objects.
    """

    def has_permission(self, request, view):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to admin users.
        return request.user.is_authenticated and request.user.role == 'admin'


class IsOrganizerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow organizers to create/edit objects.
    """

    def has_permission(self, request, view):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to organizers or admins.
        return (
            request.user.is_authenticated and 
            request.user.role in ['organizer', 'admin']
        )


class IsStudentOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow students to access certain endpoints.
    """

    def has_permission(self, request, view):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to students.
        return (
            request.user.is_authenticated and 
            request.user.role == 'student'
        )


class IsApproverOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow approvers to approve/reject objects.
    """

    def has_permission(self, request, view):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to approvers or admins.
        return (
            request.user.is_authenticated and 
            request.user.role in ['approver', 'admin']
        )


class IsClubMember(permissions.BasePermission):
    """
    Custom permission to only allow club members to access club-related objects.
    """

    def has_object_permission(self, request, view, obj):
        # Admins can access everything
        if request.user.is_authenticated and request.user.role == 'admin':
            return True

        # Check if user is a member of the club
        if hasattr(obj, 'club'):
            club = obj.club
        elif hasattr(obj, 'clubs'):
            club = obj.clubs.first()
        else:
            return False

        return club.memberships.filter(user=request.user, status='approved').exists()


class IsEventOrganizer(permissions.BasePermission):
    """
    Custom permission to only allow event organizers to manage events.
    """

    def has_object_permission(self, request, view, obj):
        # Admins can access everything
        if request.user.is_authenticated and request.user.role == 'admin':
            return True

        # Check if user is the event creator
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user

        return False


class IsRegisteredForEvent(permissions.BasePermission):
    """
    Custom permission to only allow registered users to access event-specific features.
    """

    def has_object_permission(self, request, view, obj):
        # Admins and event organizers can access everything
        if request.user.is_authenticated and request.user.role in ['admin', 'organizer']:
            return True

        # Check if user is registered for the event
        if hasattr(obj, 'event'):
            event = obj.event
        elif hasattr(obj, 'registrations'):
            event = obj
        else:
            return False

        return event.registrations.filter(user=request.user).exists()


class CanApproveEvents(permissions.BasePermission):
    """
    Custom permission to only allow approvers to approve events.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role in ['approver', 'admin']
        )


class CanApproveClubs(permissions.BasePermission):
    """
    Custom permission to only allow approvers to approve clubs.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role in ['approver', 'admin']
        )


class IsVerifiedUser(permissions.BasePermission):
    """
    Custom permission to only allow verified users.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.is_verified
        )


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners or admins to access objects.
    """

    def has_object_permission(self, request, view, obj):
        # Admins can access everything
        if request.user.is_authenticated and request.user.role == 'admin':
            return True

        # Check if user is the owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user

        return False
