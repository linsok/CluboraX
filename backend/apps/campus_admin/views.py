from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.core.paginator import Paginator
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from django.core.serializers.json import DjangoJSONEncoder
import json
from datetime import datetime, timedelta
from .models import (
    User, Proposal, UserActivity, SystemLog, 
    Announcement, AdminSettings, UserSession
)

def is_admin(user):
    """Check if user is admin"""
    return user.is_authenticated and user.role in ['admin', 'super_admin']

def is_super_admin(user):
    """Check if user is super admin"""
    return user.is_authenticated and user.role == 'super_admin'

@login_required
@user_passes_test(is_admin)
def admin_dashboard(request):
    """Admin dashboard view"""
    # Get statistics
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    pending_proposals = Proposal.objects.filter(status='pending').count()
    total_proposals = Proposal.objects.count()
    
    # Recent activities
    recent_activities = UserActivity.objects.select_related('user').order_by('-created_at')[:10]
    
    # Proposal statistics
    proposal_stats = Proposal.objects.values('status').annotate(count=Count('id'))
    
    # User role statistics
    user_stats = User.objects.values('role').annotate(count=Count('id'))
    
    # System health
    system_health = {
        'database': 'healthy',  # Could add actual health checks
        'storage': 'healthy',
        'cache': 'healthy',
    }
    
    context = {
        'total_users': total_users,
        'active_users': active_users,
        'pending_proposals': pending_proposals,
        'total_proposals': total_proposals,
        'recent_activities': recent_activities,
        'proposal_stats': list(proposal_stats),
        'user_stats': list(user_stats),
        'system_health': system_health,
    }
    
    return render(request, 'admin/dashboard.html', context)

@login_required
@user_passes_test(is_admin)
def user_management(request):
    """User management view"""
    search = request.GET.get('search', '')
    role_filter = request.GET.get('role', '')
    status_filter = request.GET.get('status', '')
    
    users = User.objects.all()
    
    if search:
        users = users.filter(
            Q(email__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(student_id__icontains=search)
        )
    
    if role_filter:
        users = users.filter(role=role_filter)
    
    if status_filter:
        users = users.filter(status=status_filter)
    
    paginator = Paginator(users, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search': search,
        'role_filter': role_filter,
        'status_filter': status_filter,
        'role_choices': User.ROLE_CHOICES,
        'status_choices': User.STATUS_CHOICES,
    }
    
    return render(request, 'admin/user_management.html', context)

@login_required
@user_passes_test(is_admin)
def user_detail(request, user_id):
    """User detail view"""
    user = get_object_or_404(User, id=user_id)
    activities = UserActivity.objects.filter(user=user).order_by('-created_at')[:20]
    sessions = UserSession.objects.filter(user=user).order_by('-last_activity')[:10]
    
    context = {
        'target_user': user,
        'activities': activities,
        'sessions': sessions,
    }
    
    return render(request, 'admin/user_detail.html', context)

@login_required
@user_passes_test(is_admin)
def proposal_management(request):
    """Proposal management view"""
    search = request.GET.get('search', '')
    type_filter = request.GET.get('type', '')
    status_filter = request.GET.get('status', '')
    priority_filter = request.GET.get('priority', '')
    
    proposals = Proposal.objects.select_related('submitted_by', 'reviewed_by').all()
    
    if search:
        proposals = proposals.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(submitted_by__email__icontains=search)
        )
    
    if type_filter:
        proposals = proposals.filter(type=type_filter)
    
    if status_filter:
        proposals = proposals.filter(status=status_filter)
    
    if priority_filter:
        proposals = proposals.filter(priority=priority_filter)
    
    paginator = Paginator(proposals, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search': search,
        'type_filter': type_filter,
        'status_filter': status_filter,
        'priority_filter': priority_filter,
        'type_choices': Proposal.TYPE_CHOICES,
        'status_choices': Proposal.STATUS_CHOICES,
        'priority_choices': Proposal.PRIORITY_CHOICES,
    }
    
    return render(request, 'admin/proposal_management.html', context)

@login_required
@user_passes_test(is_admin)
def proposal_detail(request, proposal_id):
    """Proposal detail view"""
    proposal = get_object_or_404(Proposal, id=proposal_id)
    comments = proposal.proposal_comments.select_related('author').order_by('created_at')
    
    if request.method == 'POST':
        action = request.POST.get('action')
        
        if action in ['approve', 'reject']:
            proposal.status = 'approved' if action == 'approve' else 'rejected'
            proposal.reviewed_by = request.user
            proposal.reviewed_at = timezone.now()
            proposal.save()
            
            # Log the action
            UserActivity.objects.create(
                user=request.user,
                action=f'proposal_{action}',
                description=f'{action.title()} proposal: {proposal.title}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            messages.success(request, f'Proposal {action}d successfully!')
            return redirect('admin:proposal_detail', proposal_id=proposal_id)
        
        # Add comment
        comment_content = request.POST.get('comment')
        if comment_content:
            proposal.proposal_comments.create(
                author=request.user,
                content=comment_content,
                is_internal=request.POST.get('is_internal', False)
            )
            messages.success(request, 'Comment added successfully!')
            return redirect('admin:proposal_detail', proposal_id=proposal_id)
    
    context = {
        'proposal': proposal,
        'comments': comments,
    }
    
    return render(request, 'admin/proposal_detail.html', context)

@login_required
@user_passes_test(is_admin)
def analytics(request):
    """Analytics view"""
    # User analytics
    user_growth = User.objects.extra(
        select={'day': 'date(created_at)'}
    ).values('day').annotate(count=Count('id')).order_by('day')[:30]
    
    # Proposal analytics
    proposal_trends = Proposal.objects.extra(
        select={'day': 'date(created_at)'}
    ).values('day').annotate(count=Count('id')).order_by('day')[:30]
    
    # Activity analytics
    activity_stats = UserActivity.objects.values('action').annotate(count=Count('id'))
    
    # System logs
    recent_logs = SystemLog.objects.order_by('-created_at')[:50]
    
    context = {
        'user_growth': list(user_growth),
        'proposal_trends': list(proposal_trends),
        'activity_stats': list(activity_stats),
        'recent_logs': recent_logs,
    }
    
    return render(request, 'admin/analytics.html', context)

@login_required
@user_passes_test(is_admin)
def system_settings(request):
    """System settings view"""
    if request.method == 'POST':
        for key, value in request.POST.items():
            if key.startswith('setting_'):
                setting_key = key[8:]  # Remove 'setting_' prefix
                setting, created = AdminSettings.objects.get_or_create(
                    key=setting_key,
                    defaults={'value': value}
                )
                if not created:
                    setting.value = value
                    setting.save()
        
        messages.success(request, 'Settings updated successfully!')
        return redirect('admin:system_settings')
    
    settings = AdminSettings.objects.all().order_by('key')
    
    context = {
        'settings': settings,
    }
    
    return render(request, 'admin/system_settings.html', context)

@login_required
@user_passes_test(is_admin)
def announcements(request):
    """Announcements management view"""
    announcements = Announcement.objects.select_related('created_by').order_by('-created_at')
    
    context = {
        'announcements': announcements,
    }
    
    return render(request, 'admin/announcements.html', context)

@login_required
@user_passes_test(is_admin)
@require_http_methods(['POST'])
def create_announcement(request):
    """Create new announcement"""
    title = request.POST.get('title')
    content = request.POST.get('content')
    announcement_type = request.POST.get('type', 'info')
    target_roles = request.POST.getlist('target_roles')
    is_active = request.POST.get('is_active', False) == 'on'
    
    if title and content:
        announcement = Announcement.objects.create(
            title=title,
            content=content,
            type=announcement_type,
            target_roles=target_roles,
            is_active=is_active,
            created_by=request.user
        )
        
        messages.success(request, 'Announcement created successfully!')
    else:
        messages.error(request, 'Title and content are required!')
    
    return redirect('admin:announcements')

@login_required
@user_passes_test(is_admin)
def system_logs(request):
    """System logs view"""
    level_filter = request.GET.get('level', '')
    module_filter = request.GET.get('module', '')
    search = request.GET.get('search', '')
    
    logs = SystemLog.objects.all()
    
    if level_filter:
        logs = logs.filter(level=level_filter)
    
    if module_filter:
        logs = logs.filter(module__icontains=module_filter)
    
    if search:
        logs = logs.filter(message__icontains=search)
    
    paginator = Paginator(logs, 50)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'level_filter': level_filter,
        'module_filter': module_filter,
        'search': search,
        'level_choices': SystemLog.LEVEL_CHOICES,
    }
    
    return render(request, 'admin/system_logs.html', context)

@login_required
@user_passes_test(is_super_admin)
def user_action(request, user_id, action):
    """Perform user actions (activate, deactivate, suspend, etc.)"""
    user = get_object_or_404(User, id=user_id)
    
    if action == 'activate':
        user.is_active = True
        user.status = 'active'
        messages.success(request, f'User {user.email} activated successfully!')
    elif action == 'deactivate':
        user.is_active = False
        user.status = 'inactive'
        messages.success(request, f'User {user.email} deactivated successfully!')
    elif action == 'suspend':
        user.is_active = False
        user.status = 'suspended'
        messages.success(request, f'User {user.email} suspended successfully!')
    elif action == 'verify':
        user.is_verified = True
        messages.success(request, f'User {user.email} verified successfully!')
    elif action == 'unverify':
        user.is_verified = False
        messages.success(request, f'User {user.email} unverified successfully!')
    
    user.save()
    
    # Log the action
    UserActivity.objects.create(
        user=request.user,
        action=f'user_{action}',
        description=f'{action.title()} user: {user.email}',
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    return redirect('admin:user_detail', user_id=user_id)

# API endpoints for AJAX requests
@login_required
@user_passes_test(is_admin)
def api_user_stats(request):
    """API endpoint for user statistics"""
    stats = {
        'total': User.objects.count(),
        'active': User.objects.filter(is_active=True).count(),
        'verified': User.objects.filter(is_verified=True).count(),
        'by_role': list(User.objects.values('role').annotate(count=Count('id')))
    }
    return JsonResponse(stats)

@login_required
@user_passes_test(is_admin)
def api_proposal_stats(request):
    """API endpoint for proposal statistics"""
    stats = {
        'total': Proposal.objects.count(),
        'pending': Proposal.objects.filter(status='pending').count(),
        'approved': Proposal.objects.filter(status='approved').count(),
        'rejected': Proposal.objects.filter(status='rejected').count(),
        'by_type': list(Proposal.objects.values('type').annotate(count=Count('id'))),
        'by_status': list(Proposal.objects.values('status').annotate(count=Count('id')))
    }
    return JsonResponse(stats)

@login_required
@user_passes_test(is_admin)
def api_system_health(request):
    """API endpoint for system health check"""
    health = {
        'status': 'healthy',
        'database': 'healthy',
        'storage': 'healthy',
        'cache': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'uptime': '24h 30m',  # Would calculate actual uptime
    }
    return JsonResponse(health)
