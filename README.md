# CluboraX - Campus Event and Club Management System

A comprehensive web-based platform for managing university events and student clubs, built with React.js frontend, Django backend, and MySQL database.

## 🚀 Quick Start with Docker

The easiest way to run CluboraX is using Docker Compose:

```bash
# Clone the repository
git clone <repository-url>
cd cluborax

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8000
# Admin Panel: http://localhost:8000/admin/
```

## 📋 Features

### ✅ Core Features (Implemented)
- **User Management**: Role-based access control (Students, Organizers, Approvers, Admins)
- **Event Management**: Create, approve, register, and track attendance for events
- **Club Management**: Club proposals, membership management, and approval workflows
- **Notification System**: Email and in-app notifications for updates and reminders
- **QR Code Ticketing**: Secure attendance tracking with unique QR codes
- **Gallery System**: Photo and media management for events
- **Admin Panel**: Comprehensive system oversight and control

### 🚧 Advanced Features (In Development)
- **AI Advisor**: Intelligent assistance for event and club proposals *(Services implemented, API integration pending)*
- **Payment Integration**: KHQR Bakong API for paid events *(Models created, views/serializers needed)*
- **Push Notifications**: Firebase integration for real-time notifications *(Placeholder implementation)*
- **OCR System**: Document processing for event materials *(Placeholder implementation)*

## 🛠 Technology Stack

### Frontend
- React.js 18+ with Vite
- TypeScript
- TailwindCSS for styling
- Lucide React for icons
- React Router for navigation
- Axios for API calls

### Backend
- Django 4.2+ with Django REST Framework
- MySQL 8.0 / PostgreSQL database
- JWT authentication with token blacklisting
- Celery for background tasks with Redis
- Role-based permissions system

### DevOps & Deployment
- Docker & Docker Compose
- GitHub Actions CI/CD pipeline
- AWS ECR/ECS for deployment
- Security scanning with Trivy
- Code quality checks (Black, isort, flake8)

## 📁 Project Structure

```
cluborax/
├── frontend/                 # React.js frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── utils/          # Utility functions
│   │   └── api/            # API service functions
│   ├── public/             # Static assets
│   ├── Dockerfile          # Production Docker image
│   ├── nginx.conf          # Nginx configuration
│   └── package.json
├── backend/                 # Django backend
│   ├── campus_management/  # Django project settings
│   ├── apps/               # Django applications
│   │   ├── users/          # User management & auth
│   │   ├── core/           # Core functionality & permissions
│   │   ├── events/         # Event management system
│   │   ├── clubs/          # Club management system
│   │   ├── notifications/  # Notification system
│   │   ├── gallery/        # Media gallery system
│   │   ├── payments/       # Payment processing (partial)
│   │   ├── admin_panel/    # Admin dashboard
│   │   ├── campus_admin/   # Campus administration
│   │   └── ai_advisor/     # AI assistance (partial)
│   ├── Dockerfile          # Production Docker image
│   ├── requirements.txt    # Python dependencies
│   └── manage.py
├── database/               # Database initialization
├── .github/workflows/      # CI/CD pipelines
├── docker-compose.yml      # Development environment
└── README.md
```

## 🏃‍♂️ Manual Installation (Alternative)

### Prerequisites
- Node.js 18+
- Python 3.11+
- MySQL 8.0+ or PostgreSQL
- Redis server
- Git

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up database
# Create MySQL database: campus_management
# Update settings.py with your database credentials

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔐 User Roles & Permissions

### 👨‍🎓 Students
- Browse and register for events
- Join clubs and manage memberships
- View QR tickets for events
- Receive notifications and updates

### 👔 Organizers
- Create and manage events
- Manage club memberships
- Track attendance and payments
- Upload event materials

### ✅ Approvers (Student Affairs, Dean, Finance, Venue Manager)
- Review and approve proposals
- Verify budgets and policies
- Ensure compliance with university regulations

### 👑 Administrators
- Full system oversight
- User management and access control
- System configuration and maintenance
- Report generation and analytics

## 🔄 CI/CD Pipeline

CluboraX includes a comprehensive CI/CD pipeline with:

### Automated Testing
- **Backend**: Django tests with coverage reporting
- **Frontend**: React tests with coverage reporting
- **Integration**: Docker Compose testing

### Code Quality
- **Python**: Black formatting, isort imports, flake8 linting
- **JavaScript**: ESLint configuration
- **Security**: Trivy vulnerability scanning

### Deployment
- **Containerization**: Multi-stage Docker builds
- **Registry**: AWS ECR integration
- **Orchestration**: AWS ECS deployment
- **Monitoring**: Health checks and logging

### Pipeline Stages
1. **Code Checkout** - Repository cloning
2. **Dependency Installation** - Package installation
3. **Testing** - Unit and integration tests
4. **Code Quality** - Linting and formatting
5. **Security Scanning** - Vulnerability assessment
6. **Docker Build** - Container image creation
7. **Deployment** - Production deployment (main branch only)

## 📚 API Documentation

API documentation is available at `/api/docs/` when running the backend server.

Interactive Swagger UI: `http://localhost:8000/api/docs/`
ReDoc documentation: `http://localhost:8000/api/redoc/`

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test --verbosity=2
```

### Frontend Tests
```bash
cd frontend
npm test -- --coverage --watchAll=false
```

### Docker Testing
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use TypeScript for all new React components
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure Docker compatibility

## 🔒 Security

- JWT token authentication with blacklisting
- Role-based access control
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Security headers configuration

## 📊 Monitoring & Logging

- Django logging configuration
- Celery task monitoring
- Database query optimization
- Performance monitoring
- Error tracking and alerting

## 🚀 Deployment

### Production Environment Variables
```bash
# Django Settings
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DB_NAME=production_db
DB_USER=prod_user
DB_PASSWORD=secure_password
DB_HOST=production-db-host

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=app-password

# External Services
REDIS_URL=redis://production-redis:6379
FIREBASE_API_KEY=your-firebase-key
KHQR_API_KEY=your-khqr-key
```

### Scaling Considerations
- Horizontal scaling with load balancer
- Database read replicas
- Redis clustering
- CDN for static assets
- Background job queuing

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `docs/` folder

## 🎓 Academic Project

**Royal University of Phnom Penh**  
Bachelor of Engineering in Data Science and Engineering  
Campus Event and Club Management System (CluboraX)

*This project demonstrates full-stack development, DevOps practices, and scalable architecture design.*
