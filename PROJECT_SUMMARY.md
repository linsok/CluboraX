# CluboraX - Campus Event and Club Management Platform

## 📋 Project Overview

CluboraX is a comprehensive campus management platform designed to streamline event organization, club management, and student engagement. The platform connects students, organizers, and administrators in a unified ecosystem for campus activities.

## 🏗️ Technical Architecture

### Frontend Technology Stack
- **Framework**: React 18 with functional components and hooks
- **Routing**: React Router DOM v6 for client-side routing
- **State Management**: 
  - React Query (@tanstack/react-query) for server state management
  - React Context for authentication state
- **UI/UX**: 
  - Tailwind CSS for styling
  - Framer Motion for animations
  - Heroicons for iconography
- **HTTP Client**: Axios for API communication
- **Notifications**: React Hot Toast for user feedback
- **Authentication**: JWT token-based authentication

### Backend Technology Stack
- **Framework**: Django 5.2 with Django REST Framework
- **Database**: SQLite (development), PostgreSQL (production ready)
- **Authentication**: 
  - Django's built-in authentication system
  - JWT tokens for API authentication
  - Role-based access control (Student, Organizer, Admin)
- **API Documentation**: Django REST Framework Spectacular (Swagger/OpenAPI)
- **File Storage**: Django's file handling system
- **Logging**: Django's logging framework

### Development Tools
- **Package Manager**: npm (frontend), pip (backend)
- **Version Control**: Git
- **Development Server**: Vite (frontend), Django development server (backend)
- **Code Quality**: ESLint, Prettier (frontend)

## 🌐 API Architecture

### Authentication APIs
```
POST /api/auth/login/          - User login
POST /api/auth/register/       - User registration
POST /api/auth/logout/         - User logout
POST /api/auth/refresh/        - Token refresh
POST /api/auth/verify-email/   - Email verification
POST /api/auth/reset-password/ - Password reset
```

### Admin APIs
```
POST /api/admin/login/         - Admin login
GET  /api/admin/users/         - Get all users (paginated)
PATCH /api/admin/users/{id}/   - Update user status
GET  /api/admin/requests/      - Get all requests (events + clubs)
PATCH /api/admin/requests/{id}/ - Update request status
GET  /api/admin/stats/         - Get dashboard statistics
```

### User APIs
```
GET  /api/users/profile/       - Get user profile
PUT  /api/users/profile/       - Update user profile
GET  /api/users/activities/    - Get user activities
```

### Event APIs
```
GET    /api/events/            - Get all events
POST   /api/events/            - Create new event
GET    /api/events/{id}/       - Get event details
PUT    /api/events/{id}/       - Update event
DELETE /api/events/{id}/       - Delete event
POST   /api/events/{id}/register/ - Register for event
```

### Club APIs
```
GET    /api/clubs/             - Get all clubs
POST   /api/clubs/             - Create new club
GET    /api/clubs/{id}/        - Get club details
PUT    /api/clubs/{id}/        - Update club
DELETE /api/clubs/{id}/        - Delete club
POST   /api/clubs/{id}/join/   - Join club
```

### Gallery APIs
```
GET  /api/gallery/             - Get gallery images
POST /api/gallery/             - Upload image
DELETE /api/gallery/{id}/      - Delete image
```

## 👥 User Roles & Permissions

### Student Role
- **Permissions**: View events, register for events, join clubs, upload gallery images
- **Dashboard**: Personal dashboard with registered events and joined clubs
- **Features**: Event discovery, club browsing, profile management

### Organizer Role
- **Permissions**: All student permissions + create/manage events, create/manage clubs
- **Dashboard**: Enhanced dashboard with event management tools
- **Features**: Event creation, club management, attendee tracking

### Admin Role
- **Permissions**: Full system access, user management, system administration
- **Dashboard**: Comprehensive admin panel with analytics
- **Features**: User management, request approval, system monitoring

## 🔄 Business Flow

### User Registration Flow
1. **Registration**: User fills registration form with email, password, and personal details
2. **Email Verification**: User receives verification email (optional)
3. **Role Selection**: User selects role (Student/Organizer)
4. **Profile Setup**: User completes profile with additional information
5. **Dashboard Access**: User is redirected to role-appropriate dashboard

### Event Management Flow
1. **Event Creation**: Organizer creates event with details, schedule, and capacity
2. **Admin Approval**: Admin reviews and approves/rejects event requests
3. **Event Publication**: Approved events become visible to students
4. **Student Registration**: Students browse and register for events
5. **Attendance Tracking**: Organizers can track event attendance
6. **Event Completion**: Post-event analytics and feedback collection

### Club Management Flow
1. **Club Creation**: Organizer creates club with details and objectives
2. **Admin Approval**: Admin reviews and approves/rejects club requests
3. **Club Activation**: Approved clubs become active for student joining
4. **Member Management**: Organizers manage club members and activities
5. **Activity Planning**: Clubs organize events and activities
6. **Community Building**: Ongoing engagement and growth

### Admin Management Flow
1. **User Monitoring**: Admin monitors user registrations and activities
2. **Request Processing**: Admin processes event and club creation requests
3. **System Analytics**: Admin reviews platform usage and engagement metrics
4. **Content Moderation**: Admin ensures appropriate content and behavior
5. **System Maintenance**: Admin performs system updates and maintenance

## 📊 Database Schema

### User Model
```python
class User(AbstractUser):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(choices=ROLE_CHOICES)
    is_verified = models.BooleanField(default=False)
    profile_picture = models.ImageField(upload_to='profiles/')
    phone = models.CharField(max_length=20, blank=True)
    faculty = models.CharField(max_length=100, blank=True)
    major = models.CharField(max_length=100, blank=True)
    year_of_study = models.IntegerField(blank=True, null=True)
```

### Event Model
```python
class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    organizer = models.ForeignKey(User, on_delete=models.CASCADE)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    location = models.CharField(max_length=200)
    max_attendees = models.IntegerField()
    current_attendees = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(choices=STATUS_CHOICES)
    category = models.CharField(max_length=100)
    tags = models.ManyToManyField('Tag', blank=True)
    image = models.ImageField(upload_to='events/', blank=True)
```

### Club Model
```python
class Club(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    organizer = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.CharField(max_length=100)
    meeting_time = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=200)
    max_members = models.IntegerField()
    current_members = models.IntegerField(default=0)
    status = models.CharField(choices=STATUS_CHOICES)
    logo = models.ImageField(upload_to='clubs/', blank=True)
```

## 🔐 Security Features

### Authentication Security
- **Password Hashing**: Django's secure password hashing
- **JWT Tokens**: Short-lived access tokens with refresh mechanism
- **Session Management**: Secure session handling
- **CSRF Protection**: Cross-site request forgery protection
- **Rate Limiting**: API rate limiting to prevent abuse

### Email Uniqueness Enforcement
The platform ensures **1 user = 1 email** through multiple validation layers:

#### Database Level (Primary Enforcement)
```python
class User(AbstractUser):
    email = models.EmailField(unique=True)  # Database constraint
```

#### Model Validation Layer
```python
class UserRegistrationSerializer(serializers.ModelSerializer):
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
```

#### API Level Validation
```python
def post(self, request):
    email = request.data.get('email')
    if User.objects.filter(email__iexact=email).exists():
        return Response({
            'error': 'User with this email already exists'
        }, status=400)
```

#### Frontend Validation
```javascript
const validateEmail = async (email) => {
    try {
        const response = await apiClient.post('/api/auth/check-email/', { email })
        return response.available
    } catch (error) {
        return false
    }
}
```

#### Enforcement Flow:
1. **Database Constraint**: `UNIQUE` constraint prevents duplicate emails
2. **Case Insensitive Check**: `email__iexact` handles case variations
3. **Email Normalization**: Converts to lowercase and strips whitespace
4. **Real-time Validation**: Frontend checks availability before submission
5. **Error Handling**: Clear error messages for duplicate attempts

#### What Happens on Duplicate Email:
```json
POST /api/auth/register/
{
    "email": "existing@email.com",
    "password": "password123"
}

Response:
{
    "error": "User with this email already exists"
}
Status: 400 Bad Request
```

### Data Protection
- **Input Validation**: Comprehensive input validation and sanitization
- **SQL Injection Prevention**: Django ORM protects against SQL injection
- **XSS Protection**: Built-in XSS protection
- **File Upload Security**: Secure file upload handling
- **Privacy Compliance**: GDPR-compliant data handling

## 🎨 UI/UX Features

### Design System
- **Responsive Design**: Mobile-first responsive design
- **Dark/Light Themes**: Support for theme switching
- **Accessibility**: WCAG 2.1 compliance
- **Micro-interactions**: Smooth animations and transitions
- **Loading States**: Proper loading indicators and skeleton screens

### User Experience
- **Intuitive Navigation**: Clear navigation structure
- **Search & Filter**: Advanced search and filtering capabilities
- **Real-time Updates**: Live updates for events and registrations
- **Error Handling**: User-friendly error messages
- **Progressive Web App**: PWA capabilities for mobile experience

## 📈 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Optimized image loading and compression
- **Caching Strategy**: Browser caching for static assets
- **Bundle Optimization**: Optimized JavaScript bundle size
- **CDN Integration**: Content delivery network for static assets

### Backend Optimization
- **Database Optimization**: Indexed queries and optimized relationships
- **Caching**: Redis caching for frequently accessed data
- **API Optimization**: Efficient API responses with pagination
- **Background Tasks**: Asynchronous task processing
- **Monitoring**: Performance monitoring and logging

## 🚀 Deployment Architecture

### Development Environment
- **Frontend**: Vite development server on port 5175
- **Backend**: Django development server on port 8000
- **Database**: SQLite for local development
- **Hot Reload**: Live reloading for both frontend and backend

### Production Environment
- **Frontend**: Static files served by Nginx or CDN
- **Backend**: Gunicorn WSGI server behind Nginx
- **Database**: PostgreSQL with connection pooling
- **Caching**: Redis for session and data caching
- **Load Balancer**: Nginx as reverse proxy and load balancer

## 🧪 Testing Strategy

### Frontend Testing
- **Unit Tests**: Jest and React Testing Library
- **Integration Tests**: Component integration testing
- **E2E Tests**: Cypress for end-to-end testing
- **Visual Regression**: Storybook for component testing

### Backend Testing
- **Unit Tests**: Django's built-in testing framework
- **API Tests**: DRF test client for API testing
- **Integration Tests**: Database integration testing
- **Performance Tests**: Load testing with Locust

## 📱 Mobile Compatibility

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Touch Gestures**: Touch-friendly interface
- **Offline Support**: PWA capabilities for offline usage
- **Push Notifications**: Web push notification support

## 🔧 Development Workflow

### Git Workflow
- **Branching Strategy**: Feature branching with pull requests
- **Code Review**: Peer review process for all changes
- **CI/CD**: Automated testing and deployment
- **Version Control**: Semantic versioning

### Development Standards
- **Code Style**: ESLint and Prettier for consistent code formatting
- **Documentation**: Comprehensive code documentation
- **Testing**: Test-driven development approach
- **Security**: Security-first development practices

## 📊 Analytics & Monitoring

### User Analytics
- **Event Tracking**: User interaction tracking
- **Performance Metrics**: Application performance monitoring
- **Error Tracking**: Error logging and monitoring
- **Usage Statistics**: Platform usage analytics

### System Monitoring
- **Server Monitoring**: Server health and performance
- **Database Monitoring**: Database performance and optimization
- **API Monitoring**: API response times and error rates
- **Security Monitoring**: Security threat detection

## 🌟 Key Features Summary

### For Students
- **Event Discovery**: Browse and search campus events
- **Easy Registration**: One-click event registration
- **Club Joining**: Join and participate in clubs
- **Social Features**: Connect with other students
- **Personal Dashboard**: Track activities and schedule

### For Organizers
- **Event Management**: Create and manage events
- **Club Management**: Create and manage clubs
- **Member Management**: Track members and participants
- **Analytics**: Event performance metrics
- **Communication Tools**: Announce events and updates

### For Administrators
- **User Management**: Manage user accounts and permissions
- **Content Moderation**: Review and approve content
- **System Analytics**: Platform-wide usage statistics
- **Security Management**: Monitor and secure the platform
- **Configuration**: System settings and customization

## 🎯 Future Enhancements

### Planned Features
- **Mobile Apps**: Native iOS and Android applications
- **Payment Integration**: Online payment processing for events
- **Advanced Analytics**: AI-powered insights and recommendations
- **Social Features**: Enhanced social networking capabilities
- **Integration APIs**: Third-party system integrations

### Scalability Plans
- **Multi-tenant Support**: Support for multiple institutions
- **Cloud Migration**: Full cloud deployment
- **Microservices**: Microservices architecture transition
- **Global Expansion**: Multi-language and multi-region support

---

## 📞 Contact Information

**Project Repository**: https://github.com/linsok/CluboraX
**Documentation**: Available in the repository wiki
**Support**: Create issues in the GitHub repository

---

*This document provides a comprehensive overview of the CluboraX platform, its technical architecture, business logic, and implementation details. For specific implementation questions, refer to the codebase and inline documentation.*
