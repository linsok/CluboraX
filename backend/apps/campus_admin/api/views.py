from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth.models import User
from django.db.models import Count, Avg, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator
from django.db.models import Q
import json

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    try:
        # User statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        verified_users = User.objects.filter(is_verified=True).count()
        
        # Recent activity (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_users = User.objects.filter(date_joined__gte=seven_days_ago).count()
        
        # User roles distribution
        user_roles = {}
        for role, _ in User.ROLE_CHOICES:
            user_roles[role] = User.objects.filter(role=role).count()
        
        # Mock proposal data (replace with actual models when available)
        pending_proposals = 0
        approved_proposals = 0
        total_proposals = 0
        
        # Mock event data (replace with actual models when available)
        total_events = 0
        upcoming_events = 0
        
        # Mock revenue data (replace with actual models when available)
        total_revenue = 0
        monthly_revenue = 0
        
        data = {
            'users': {
                'total': total_users,
                'active': active_users,
                'verified': verified_users,
                'recent': recent_users,
                'roles': user_roles
            },
            'proposals': {
                'pending': pending_proposals,
                'approved': approved_proposals,
                'total': total_proposals
            },
            'events': {
                'total': total_events,
                'upcoming': upcoming_events
            },
            'revenue': {
                'total': total_revenue,
                'monthly': monthly_revenue
            },
            'growth': {
                'users': recent_users,
                'monthly_growth': 12.5
            }
        }
        
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_stats(request):
    """Get detailed user statistics"""
    try:
        # User growth over time (last 30 days)
        user_growth = []
        for i in range(30):
            date = timezone.now() - timedelta(days=i)
            day_users = User.objects.filter(date_joined__date=date.date()).count()
            user_growth.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': day_users
            })
        user_growth.reverse()  # Most recent first
        
        # User activity by role
        user_activity = {}
        for role, _ in User.ROLE_CHOICES:
            user_activity[role] = User.objects.filter(role=role).count()
        
        # Recent users
        recent_users = User.objects.order_by('-date_joined')[:10]
        recent_users_data = []
        for user in recent_users:
            recent_users_data.append({
                'id': user.id,
                'name': user.get_full_name() or user.username,
                'email': user.email,
                'role': user.role,
                'status': 'active' if user.is_active else 'inactive',
                'is_verified': user.is_verified,
                'date_joined': user.date_joined.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None
            })
        
        data = {
            'growth': user_growth,
            'activity': user_activity,
            'recent_users': recent_users_data
        }
        
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def proposal_stats(request):
    """Get proposal statistics"""
    try:
        # Mock data - replace with actual Proposal model when available
        proposal_data = {
            'total': 156,
            'pending': 34,
            'approved': 122,
            'rejected': 0,
            'under_review': 0,
            'implemented': 0,
            'cancelled': 0,
            'by_type': {
                'club': 45,
                'event': 32,
                'project': 28,
                'funding': 28,
                'complaint': 12,
                'suggestion': 11
            },
            'by_status': {
                'pending': 34,
                'approved': 122,
                'rejected': 0,
                'under_review': 0,
                'implemented': 0,
                'cancelled': 0
            },
            'by_priority': {
                'urgent': 8,
                'high': 25,
                'medium': 45,
                'low': 78
            },
            'monthly_submissions': [
                {'month': '2024-01', 'count': 45},
                {'month': '2023-12', 'count': 38},
                {'month': '2023-11', 'count': 42},
                {'month': '2023-10', 'count': 31}
            ]
        }
        
        return JsonResponse(proposal_data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_list(request):
    """Get paginated list of users"""
    try:
        page = int(request.GET.get('page', 1))
        search = request.GET.get('search', '')
        role = request.GET.get('role', '')
        status = request.GET.get('status', '')
        
        # Build query
        queryset = User.objects.all()
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        if role:
            queryset = queryset.filter(role=role)
        
        if status:
            if status == 'active':
                queryset = queryset.filter(is_active=True)
            elif status == 'inactive':
                queryset = queryset.filter(is_active=False)
            elif status == 'suspended':
                queryset = queryset.filter(is_active=False, is_staff=False)
            elif status == 'pending':
                queryset = queryset.filter(is_active=False, is_verified=False)
        
        # Pagination
        paginator = Paginator(queryset, 12)  # 12 users per page
        users_page = paginator.get_page(page)
        
        # Serialize users
        users_data = []
        for user in users_page:
            users_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_staff': user.is_staff,
                'is_active': user.is_active,
                'is_verified': user.is_verified,
                'date_joined': user.date_joined.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'avatar': user.avatar.url if user.avatar else None,
                'phone': user.phone,
                'student_id': user.student_id,
                'major': user.major
            })
        
        data = {
            'users': users_data,
            'pagination': {
                'current_page': page,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
            'has_next': users_page.has_next(),
            'has_previous': users_page.has_previous()
            }
        }
        
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def proposals_list(request):
    """Get paginated list of proposals"""
    try:
        page = int(request.GET.get('page', 1))
        search = request.GET.get('search', '')
        type_filter = request.GET.get('type', '')
        status_filter = request.GET.get('status', '')
        priority_filter = request.GET.get('priority', '')
        
        # Mock data - replace with actual Proposal model when available
        proposals_data = {
            'proposals': [
                {
                    'id': 1,
                    'title': 'Computer Science Club Formation',
                    'description': 'Proposal to establish a computer science club for students interested in programming and technology.',
                    'type': 'club',
                    'status': 'pending',
                    'priority': 'high',
                    'submitted_by': {
                        'id': 1,
                        'name': 'John Doe',
                        'email': 'john@example.com'
                    },
                    'submitted_at': '2024-01-15T10:30:00Z',
                    'deadline': '2024-02-15T23:59:59Z',
                    'budget': 5000.00,
                    'tags': ['programming', 'technology', 'education'],
                    'comments': [],
                    'attachments': []
                },
                {
                    'id': 2,
                    'title': 'Spring Festival 2024',
                    'description': 'Annual spring festival with cultural activities, performances, and food stalls.',
                    'type': 'event',
                    'status': 'approved',
                    'priority': 'medium',
                    'submitted_by': {
                        'id': 2,
                        'name': 'Jane Smith',
                        'email': 'jane@example.com'
                    },
                    'submitted_at': '2024-01-14T14:20:00Z',
                    'deadline': '2024-03-15T23:59:59Z',
                    'budget': 10000.00,
                    'tags': ['festival', 'culture', 'entertainment'],
                    'comments': [
                        {
                            'id': 1,
                            'author': 'Admin',
                            'content': 'Great proposal! Approved with some modifications.',
                            'created_at': '2024-01-14T15:00:00Z'
                        }
                    ],
                    'attachments': []
                },
                {
                    'id': 3,
                    'title': 'Research Project Funding',
                    'description': 'Request for funding to support undergraduate research projects in computer science.',
                    'type': 'funding',
                    'status': 'under_review',
                    'priority': 'urgent',
                    'submitted_by': {
                        'id': 3,
                        'name': 'Mike Johnson',
                        'email': 'mike@example.com'
                    },
                    'submitted_at': '2024-01-13T09:15:00Z',
                    'deadline': '2024-01-30T23:59:59Z',
                    'budget': 15000.00,
                    'tags': ['research', 'funding', 'innovation'],
                    'comments': [],
                    'attachments': []
                }
            ],
            'pagination': {
                'current_page': page,
                'total_pages': 1,
                'total_count': 3,
                'has_next': False,
                'has_previous': False
            }
        }
        
        return JsonResponse(proposals_data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def approve_proposal(request, proposal_id):
    """Approve a proposal"""
    try:
        # Mock implementation - replace with actual Proposal model logic
        data = {
            'success': True,
            'message': f'Proposal {proposal_id} approved successfully'
        }
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def reject_proposal(request, proposal_id):
    """Reject a proposal"""
    try:
        # Mock implementation - replace with actual Proposal model logic
        data = {
            'success': True,
            'message': f'Proposal {proposal_id} rejected successfully'
        }
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def delete_proposal(request, proposal_id):
    """Delete a proposal"""
    try:
        # Mock implementation - replace with actual Proposal model logic
        data = {
            'success': True,
            'message': f'Proposal {proposal_id} deleted successfully'
        }
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def activate_user(request, user_id):
    """Activate a user"""
    try:
        user = User.objects.get(id=user_id)
        user.is_active = True
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': f'User {user.username} activated successfully'
        })
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def deactivate_user(request, user_id):
    """Deactivate a user"""
    try:
        user = User.objects.get(id=user_id)
        user.is_active = False
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': f'User {user.username} deactivated successfully'
        })
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def verify_user(request, user_id):
    """Verify a user"""
    try:
        user = User.objects.get(id=user_id)
        user.is_verified = True
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': f'User {user.username} verified successfully'
        })
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_health(request):
    """Get system health status"""
    try:
        # Database health check
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = 'healthy' if cursor.fetchone() else 'unhealthy'
        
        # Storage health check (mock)
        storage_status = 'healthy'
        
        # Cache health check (mock)
        cache_status = 'healthy'
        
        data = {
            'database': db_status,
            'storage': storage_status,
            'cache': cache_status,
            'timestamp': timezone.now().isoformat()
        }
        
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_activities(request):
    """Get recent activities"""
    try:
        # Mock data - replace with actual Activity model when available
        activities = [
            {
                'id': 1,
                'user': 'John Doe',
                'action': 'Submitted proposal',
                'target': 'Computer Science Club',
                'timestamp': '2024-01-15T10:30:00Z',
                'ip_address': '127.0.0.1'
            },
            {
                'id': 2,
                'user': 'Jane Smith',
                'action': 'Created event',
                'target': 'Spring Festival',
                'timestamp': '2024-01-14T14:20:00Z',
                'ip_address': '127.0.0.1'
            },
            {
                'id': 3,
                'user': 'Mike Johnson',
                'action': 'Joined club',
                'target': 'Photography Club',
                'timestamp': '2024-01-13T09:15:00Z',
                'ip_address': '127.0.0.1'
            },
            {
                'id': 4,
                'user': 'Sarah Wilson',
                'action': 'Updated profile',
                'target': 'Personal Information',
                'timestamp': '2024-01-12T16:45:00Z',
                'ip_address': '127.0.0.1'
            }
        ]
        
        return JsonResponse({'activities': activities})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upcoming_events(request):
    """Get upcoming events"""
    try:
        # Mock data - replace with actual Event model when available
        events = [
            {
                'id': 1,
                'title': 'Spring Festival 2024',
                'date': '2024-03-15',
                'attendees': 245,
                'status': 'upcoming',
                'description': 'Annual spring festival with cultural activities'
            },
            {
                'id': 2,
                'title': 'Tech Talk: AI in Education',
                'date': '2024-03-18',
                'attendees': 89,
                'status': 'upcoming',
                'description': 'Guest lecture on artificial intelligence in education'
            },
            {
                'id': 3,
                'title': 'Career Fair 2024',
                'date': '2024-03-22',
                'attendees': 412,
                'status': 'upcoming',
                'description': 'Annual career fair with various companies'
            }
        ]
        
        return JsonResponse({'events': events})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
