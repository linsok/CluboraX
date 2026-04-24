# Campus Hub Admin System Guide
admin@cluborax.com
admin1234

cd backend; python manage.py runserver 0.0.0.0:8888
## Overview

The Campus Hub Admin System provides comprehensive administrative control over the campus management platform. It includes user management, proposal tracking, system monitoring, and configuration management.

## Features

### 🔐 User Management
- **User Registration & Authentication**: Complete user lifecycle management
- **Role-Based Access Control**: Student, Faculty, Admin, Super Admin roles
- **User Status Management**: Active, Inactive, Suspended, Pending states
- **Profile Management**: Avatar upload, bio, academic information
- **Activity Tracking**: Monitor user login, actions, and behavior
- **Session Management**: Track active user sessions

### 📋 Proposal Management
- **Multi-Type Proposals**: Clubs, Events, Projects, Funding, Complaints, Suggestions
- **Priority Levels**: Low, Medium, High, Urgent
- **Status Tracking**: Pending, Under Review, Approved, Rejected, Implemented, Cancelled
- **Comment System**: Internal and external comments
- **Budget Management**: Track proposal budgets and funding
- **Deadline Management**: Set and monitor proposal deadlines

### 📊 Analytics & Reporting
- **User Statistics**: Growth trends, active users, role distribution
- **Proposal Analytics**: Submission trends, approval rates, type distribution
- **System Health Monitoring**: Database, storage, cache status
- **Activity Logs**: Comprehensive system activity tracking
- **Real-time Dashboard**: Live statistics and system status

### 🎛️ System Configuration
- **Global Settings**: System-wide configuration management
- **Announcement System**: Targeted announcements by role/user
- **Backup Management**: Database backup and restore
- **System Logs**: Debug, info, warning, error, critical logs
- **Email Templates**: Customizable email notifications

## Database Schema

### Core Models

#### User Model
```python
class User(AbstractUser):
    id = UUIDField(primary_key=True)
    role = CharField(choices=['student', 'faculty', 'admin', 'super_admin'])
    status = CharField(choices=['active', 'inactive', 'suspended', 'pending'])
    phone = CharField(max_length=20)
    student_id = CharField(max_length=20, unique=True)
    major = CharField(max_length=100)
    year = CharField(max_length=20)
    avatar = ImageField(upload_to='avatars/')
    bio = TextField()
    is_verified = BooleanField(default=False)
    last_login_ip = GenericIPAddressField()
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

#### Proposal Model
```python
class Proposal:
    id = UUIDField(primary_key=True)
    title = CharField(max_length=200)
    description = TextField()
    type = CharField(choices=['club', 'event', 'project', 'funding', 'complaint', 'suggestion'])
    status = CharField(choices=['pending', 'under_review', 'approved', 'rejected', 'implemented', 'cancelled'])
    priority = CharField(choices=['low', 'medium', 'high', 'urgent'])
    submitted_by = ForeignKey(User)
    reviewed_by = ForeignKey(User, null=True)
    submitted_at = DateTimeField(auto_now_add=True)
    reviewed_at = DateTimeField(null=True)
    deadline = DateTimeField(null=True)
    budget = DecimalField(max_digits=10, decimal_places=2)
    attachments = JSONField(default=list)
    comments = JSONField(default=list)
    tags = JSONField(default=list)
    is_public = BooleanField(default=False)
```

### Supporting Models

- **UserSession**: Track active user sessions
- **UserActivity**: Log user actions and system events
- **ProposalComment**: Comments on proposals
- **SystemLog**: System-wide logging
- **AdminSettings**: Global configuration
- **Announcement**: System announcements
- **Backup**: Database backup records

## API Endpoints

### User Management
- `GET /api/admin/users/` - List users with pagination and filtering
- `GET /api/admin/users/{id}/` - Get user details
- `POST /api/admin/users/{id}/activate/` - Activate user
- `POST /api/admin/users/{id}/deactivate/` - Deactivate user
- `POST /api/admin/users/{id}/suspend/` - Suspend user
- `POST /api/admin/users/{id}/verify/` - Verify user
- `DELETE /api/admin/users/{id}/` - Delete user

### Proposal Management
- `GET /api/admin/proposals/` - List proposals with filtering
- `GET /api/admin/proposals/{id}/` - Get proposal details
- `POST /api/admin/proposals/{id}/approve/` - Approve proposal
- `POST /api/admin/proposals/{id}/reject/` - Reject proposal
- `POST /api/admin/proposals/{id}/comment/` - Add comment
- `DELETE /api/admin/proposals/{id}/` - Delete proposal

### Analytics
- `GET /api/admin/dashboard-stats/` - Dashboard statistics
- `GET /api/admin/user-stats/` - User statistics
- `GET /api/admin/proposal-stats/` - Proposal statistics
- `GET /api/admin/system-health/` - System health check

### System Management
- `GET /api/admin/settings/` - Get system settings
- `POST /api/admin/settings/` - Update system settings
- `GET /api/admin/announcements/` - List announcements
- `POST /api/admin/announcements/` - Create announcement
- `GET /api/admin/logs/` - Get system logs
- `POST /api/admin/backup/` - Create backup

## Frontend Components

### Admin Dashboard
- **Real-time Statistics**: Live user and proposal counts
- **System Health**: Database, storage, cache status
- **Charts**: User growth, proposal status distribution
- **Quick Actions**: Direct access to key functions
- **Recent Activities**: Latest system events

### User Management
- **User Cards**: Visual user representation with status indicators
- **Advanced Filtering**: Search by name, email, role, status
- **Bulk Actions**: Activate, deactivate, verify multiple users
- **User Details Modal**: Complete user information and actions
- **Activity History**: Track user actions and login history

### Proposal Management
- **Proposal Cards**: Visual proposal representation with priority indicators
- **Multi-level Filtering**: Type, status, priority, date range
- **Review Workflow**: Approve/reject with comments
- **Budget Tracking**: Monitor proposal budgets and funding
- **Deadline Management**: Track proposal deadlines

## Security Features

### Authentication & Authorization
- **Role-Based Access Control**: Different permissions for each role
- **Session Management**: Secure session handling with expiration
- **IP Tracking**: Monitor login IP addresses
- **Activity Logging**: Comprehensive audit trail

### Data Protection
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Protection**: Use Django ORM
- **XSS Protection**: Escape user-generated content
- **CSRF Protection**: Django CSRF middleware

### Access Control
- **Permission Checks**: Verify user permissions before actions
- **Rate Limiting**: Prevent brute force attacks
- **Secure File Upload**: Validate file types and sizes
- **API Authentication**: Token-based API access

## Installation & Setup

### Backend Setup
1. Add admin app to `INSTALLED_APPS` in `settings.py`
2. Run migrations: `python manage.py migrate`
3. Create superuser: `python manage.py createsuperuser`
4. Configure admin URLs in `urls.py`

### Frontend Setup
1. Install admin components
2. Configure API endpoints
3. Set up authentication guards
4. Configure routing

### Database Configuration
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'campus_hub',
        'USER': 'postgres',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## Usage Guide

### Creating Admin Users
1. Access Django admin at `/admin/`
2. Create user with appropriate role
3. Set user status to 'active'
4. Assign necessary permissions

### Managing Users
1. Go to Admin Dashboard → User Management
2. Use filters to find specific users
3. Click on user card to view details
4. Use action buttons to manage user status

### Reviewing Proposals
1. Go to Admin Dashboard → Proposal Management
2. Filter by status (pending, under review)
3. Click on proposal to view details
4. Add comments and approve/reject

### System Monitoring
1. Check dashboard for system health
2. Review system logs for errors
3. Monitor user activity trends
4. Check proposal approval rates

## Customization

### Adding New Proposal Types
1. Update `Proposal.TYPE_CHOICES` in `models.py`
2. Update frontend type filters
3. Add type-specific validation
4. Update templates and components

### Custom User Roles
1. Update `User.ROLE_CHOICES` in `models.py`
2. Add role-specific permissions
3. Update frontend role filters
4. Add role-based UI elements

### Custom Notifications
1. Create notification templates
2. Configure email settings
3. Add notification triggers
4. Test notification delivery

## Troubleshooting

### Common Issues
1. **Database Connection**: Check database configuration
2. **Permission Errors**: Verify user roles and permissions
3. **File Upload Issues**: Check media file permissions
4. **Email Not Sending**: Verify email configuration

### Debug Mode
```python
# settings.py
DEBUG = True
LOGGING = {
    'version': 1,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'admin_debug.log',
        },
    },
    'loggers': {
        'apps.admin': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

## Performance Optimization

### Database Optimization
- Add database indexes for frequently queried fields
- Use `select_related` and `prefetch_related` for queries
- Implement query result caching
- Optimize database connections

### Frontend Optimization
- Implement lazy loading for large datasets
- Use virtual scrolling for user lists
- Cache API responses
- Optimize component rendering

## Security Best Practices

### Regular Maintenance
- Update Django and dependencies
- Review user permissions regularly
- Monitor system logs
- Backup database regularly

### Security Audits
- Review access logs
- Check for suspicious activity
- Validate user inputs
- Test security controls

## Support & Documentation

### Getting Help
- Check Django documentation
- Review system logs
- Contact development team
- Use community forums

### Contributing
- Follow coding standards
- Write comprehensive tests
- Document changes
- Submit pull requests

---

This admin system provides a comprehensive solution for managing the Campus Hub platform with robust security, scalability, and user-friendly interfaces.
