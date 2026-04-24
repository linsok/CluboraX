# 🚀 GitHub Pull & Local Setup Guide

After pulling code from GitHub, follow this guide to get the full project running locally with database, backend, and frontend.

---

## 📋 Prerequisites

Before starting, make sure you have these installed:

- **Git** - For cloning/pulling code
- **Python 3.10+** - Backend language  
- **Node.js 18+** - Frontend language
- **MySQL 8.0+** - Database (or Docker for easier setup)
- **Docker & Docker Compose** (Optional but recommended)

### ✅ Verify Installation

```bash
# Check versions
git --version
python --version
node --version
npm --version
docker --version
docker-compose --version
```

---

## 🎯 Option 1: Quick Start with Docker (Recommended)

### Step 1: Clone/Pull Repository
```bash
git clone <repository-url>
cd Club_Event
```

### Step 2: Start All Services
```bash
docker-compose up -d
```

This will automatically:
- ✅ Start MySQL database
- ✅ Start Django backend on port 8000
- ✅ Start React frontend on port 3000
- ✅ Initialize database with seed data

### Step 3: Access the Application
```
Frontend:  http://localhost:3000
Backend:   http://localhost:8000
Admin:     http://localhost:8000/admin/
```

### Step 4: Login Credentials
```
Admin Account:
  Email: admin@campus.com
  Password: admin123

Test Student Account:
  Email: student@campus.com
  Password: password123

Test Organizer Account:
  Email: organizer@campus.com
  Password: password123
```

### Stop Services
```bash
docker-compose down
```

---

## 🛠 Option 2: Manual Local Setup

### Step 1: Clone/Pull Repository
```bash
git clone <repository-url>
cd Club_Event
```

### Step 2: Backend Setup

#### 2.1 Create Virtual Environment
```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 2.2 Install Dependencies
```bash
pip install -r requirements.txt
```

#### 2.3 Create `.env` File
Create `backend/.env` with database credentials:

```env
# Database Configuration
DB_ENGINE=django.db.backends.mysql
DB_NAME=cluborax_db
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306

# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT Settings
JWT_SECRET_KEY=your-jwt-secret-key

# Email Settings (Optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# AWS Settings (Optional for production)
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

#### 2.4 Create Database (MySQL)
```bash
# MySQL CLI
mysql -u root -p

# In MySQL:
CREATE DATABASE cluborax_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### 2.5 Run Migrations
```bash
python manage.py migrate
```

#### 2.6 Create Superuser (Admin Account)
```bash
python manage.py createsuperuser
# Follow prompts to create admin account
```

#### 2.7 Load Seed Data (Optional)
```bash
python manage.py loaddata database/seed_data.json
```

Or create test data manually:
```bash
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
```

#### 2.8 Start Backend Server
```bash
python manage.py runserver
# Backend runs on http://localhost:8000
```

---

### Step 3: Frontend Setup

#### 3.1 Navigate to Frontend
```bash
cd frontend
```

#### 3.2 Install Dependencies
```bash
npm install
```

#### 3.3 Create `.env` File
Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=CluboraX
VITE_APP_VERSION=1.0.0
```

#### 3.4 Start Development Server
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 📊 Verify Everything Works

### ✅ Backend Check
```bash
curl http://localhost:8000/api/health/
# Should return: {"status": "ok"}
```

### ✅ Frontend Check
Open browser: `http://localhost:5173`
- Login page should appear
- No console errors

### ✅ Database Check
```bash
# In backend terminal
python manage.py dbshell
> SHOW TABLES;
> EXIT;
```

### ✅ Admin Panel Check
Go to: `http://localhost:8000/admin/`
- Login with superuser credentials
- Should see all models (Users, Events, Clubs, etc.)

---

## 🔐 Useful Django Commands

```bash
# Create new migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files (production)
python manage.py collectstatic --noinput

# Reset database (dangerous!)
python manage.py flush

# Load fixture data
python manage.py loaddata path/to/fixture.json

# Dump data to JSON
python manage.py dumpdata > backup.json

# Run Django shell
python manage.py shell

# Check for issues
python manage.py check
```

---

## 📦 Useful NPM Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Format code
npm run format
```

---

## 🐛 Common Issues & Solutions

### Issue 1: MySQL Connection Error
```
Error: (2003, "Can't connect to MySQL server")
```
**Solution:**
```bash
# Check if MySQL is running
mysql -u root -p
# If not running, start MySQL service
# Windows: services.msc → Start MySQL
# Mac: brew services start mysql
# Linux: sudo service mysql start
```

### Issue 2: Port Already in Use
```
Error: Address already in use
```
**Solution:**
```bash
# Find process using port 8000
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill process (replace PID with actual process id)
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### Issue 3: Module Not Found Error
```
ModuleNotFoundError: No module named 'rest_framework'
```
**Solution:**
```bash
# Reinstall requirements
pip install -r requirements.txt --force-reinstall

# Or in virtual environment
deactivate  # exit venv
rm -rf venv  # delete venv
python -m venv venv  # create new venv
venv\Scripts\activate  # activate (Windows)
pip install -r requirements.txt
```

### Issue 4: CORS Error in Frontend
```
Error: Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
Check `backend/campus_management/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
```

### Issue 5: Static Files Not Loading
```
Solution: Run
python manage.py collectstatic --noinput
```

---

## 🔄 Updating Code After Pull

When your friend pulls latest changes:

```bash
# Backend updates
cd backend
pip install -r requirements.txt  # In case new packages added
python manage.py migrate  # In case new migrations

# Frontend updates
cd ../frontend
npm install  # In case new packages added
```

---

## 📝 Project Structure After Setup

```
Club_Event/
├── backend/
│   ├── venv/                    # Virtual environment
│   ├── campus_management/       # Django project
│   ├── apps/                    # Django apps
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                     # Database credentials
│   └── db.sqlite3 or mysql
│
├── frontend/
│   ├── node_modules/            # NPM packages
│   ├── src/                     # React source
│   ├── public/                  # Static assets
│   ├── package.json
│   ├── .env                     # API configuration
│   └── vite.config.js
│
├── database/
│   ├── init.sql                 # Database schema
│   └── seed_data.json           # Sample data
│
├── docker-compose.yml           # Docker configuration
├── .gitignore
├── README.md
└── GITHUB_PULL_SETUP_GUIDE.md   # This file
```

---

## 🎓 First-Time Developer Checklist

After setup, verify everything:

- [ ] Backend runs on `http://localhost:8000`
- [ ] Frontend runs on `http://localhost:5173`
- [ ] Can login to admin panel
- [ ] Can access API endpoints
- [ ] Database has tables created
- [ ] No console errors in browser
- [ ] All images/styles load correctly
- [ ] Can create/read events and clubs
- [ ] Environment variables are set

---

## 📚 Additional Resources

| Task | Link |
|------|------|
| Django Docs | https://docs.djangoproject.com/ |
| React Docs | https://react.dev |
| Django REST Framework | https://www.django-rest-framework.org/ |
| MySQL Docs | https://dev.mysql.com/doc/ |
| Docker Compose | https://docs.docker.com/compose/ |
| Vite Documentation | https://vitejs.dev/ |

---

## 💬 Need Help?

1. **Check existing docs**: Look in `/docs` folder
2. **Check logs**: Both frontend and backend print detailed errors
3. **Database issues**: Use `python manage.py dbshell` to debug
4. **Frontend issues**: Open browser DevTools (F12) → Console tab
5. **Ask team**: Reach out on team chat

---

## 🔗 Quick Links

- Backend Admin: `http://localhost:8000/admin/`
- API Docs: `http://localhost:8000/api/` (if DRF schema enabled)
- Frontend: `http://localhost:5173`
- Database GUI: PhpMyAdmin (if using Docker) `http://localhost:8080`

---

**Last Updated**: April 2026
**Version**: 1.0
