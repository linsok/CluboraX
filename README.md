# Campus Event and Club Management System

A comprehensive web-based platform for managing university events and student clubs, built with React.js frontend, Django backend, and MySQL database.

## Features

### Core Features
- **User Management**: Role-based access control (Students, Organizers, Approvers, Admins)
- **Event Management**: Create, approve, register, and track attendance for events
- **Club Management**: Club proposals, membership management, and approval workflows
- **Notification System**: Email and in-app notifications for updates and reminders
- **QR Code Ticketing**: Secure attendance tracking with unique QR codes
- **Gallery System**: Photo and media management for events
- **Admin Panel**: Comprehensive system oversight and control

### Advanced Features
- **AI Advisor**: Intelligent assistance for event and club proposals
- **Payment Integration**: KHQR Bakong API for paid events
- **Multi-stage Approval**: Structured workflows for events and clubs
- **Real-time Updates**: Live notifications and status tracking

## Technology Stack

### Frontend
- React.js 18+
- TypeScript
- TailwindCSS for styling
- Lucide React for icons
- React Router for navigation
- Axios for API calls

### Backend
- Django 4.2+
- Django REST Framework
- MySQL database
- JWT authentication
- Celery for background tasks
- Redis for caching

### Additional Services
- Firebase for real-time notifications
- Google Calendar API integration
- QR code generation
- Email services (SendGrid)

## Project Structure

```
campus-management/
├── frontend/                 # React.js frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   ├── public/
│   └── package.json
├── backend/                 # Django backend
│   ├── campus_management/  # Django project
│   ├── apps/               # Django apps
│   │   ├── users/          # User management
│   │   ├── events/         # Event management
│   │   ├── clubs/          # Club management
│   │   ├── notifications/  # Notification system
│   │   └── payments/       # Payment processing
│   ├── requirements.txt
│   └── manage.py
├── database/               # Database schemas and migrations
├── docs/                   # Documentation
└── docker-compose.yml      # Development environment
```

## Installation

### Prerequisites
- Node.js 18+
- Python 3.9+
- MySQL 8.0+
- Redis server

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Database Setup
```sql
CREATE DATABASE campus_management;
CREATE USER 'campus_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON campus_management.* TO 'campus_user'@'localhost';
FLUSH PRIVILEGES;
```

## User Roles

### Students
- Browse and register for events
- Join clubs and manage memberships
- View QR tickets for events
- Receive notifications and updates

### Organizers
- Create and manage events
- Manage club memberships
- Track attendance and payments
- Upload event materials

### Approvers (Student Affairs, Dean, Finance, Venue Manager)
- Review and approve proposals
- Verify budgets and policies
- Ensure compliance with university regulations

### Administrators
- Full system oversight
- User management and access control
- System configuration and maintenance
- Report generation and analytics

## API Documentation

API documentation is available at `/api/docs/` when running the backend server.

## Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.

---

**Royal University of Phnom Penh**  
Bachelor of Engineering in Data Science and Engineering  
Campus Event and Club Management System
