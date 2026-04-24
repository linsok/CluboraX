@echo off
REM ========================================
REM Club & Event Management System Setup
REM For Windows Users
REM ========================================

echo.
echo ╔════════════════════════════════════════════╗
echo ║  🚀 Club & Event Management System Setup   ║
echo ║  Windows Quick Setup Script                ║
echo ╚════════════════════════════════════════════╝
echo.

setlocal enabledelayedexpansion

REM Check Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.8+ 
    echo 📥 Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python found
echo.

REM Navigate to backend directory
cd backend

REM Step 1: Database Migration
echo 1️⃣  Running database migrations...
python manage.py migrate
if errorlevel 1 (
    echo ❌ Migration failed
    pause
    exit /b 1
)
echo ✅ Migration complete
echo.

REM Step 2: Create Superuser
echo 2️⃣  Creating admin superuser...
echo 📧 Follow the prompts below:
echo.
python manage.py createsuperuser
echo.

REM Step 3: Seed Demo Data
echo 3️⃣  Seeding demo data...
python manage.py seed_demo_data
if errorlevel 1 (
    echo ⚠️  Demo data seeding had issues (check output above)
) else (
    echo ✅ Demo data created successfully
)
echo.

REM Return to root directory
cd ..

REM Step 4: Install Frontend Dependencies
echo 4️⃣  Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ⚠️  NPM install had issues
) else (
    echo ✅ Frontend dependencies installed
)
cd ..
echo.

REM Show final instructions
cls
echo.
echo ╔════════════════════════════════════════════╗
echo ║            ✅ Setup Complete!              ║
echo ╚════════════════════════════════════════════╝
echo.
echo 📝 NEXT STEPS:
echo.
echo 1. START BACKEND (run in one terminal):
echo    cd backend
echo    python manage.py runserver
echo.
echo 2. START FRONTEND (run in another terminal):
echo    cd frontend  
echo    npm run dev
echo.
echo 3. ACCESS THE APPLICATION:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8888
echo    Admin:    http://localhost:8888/admin
echo.
echo 👤 TEST ACCOUNT:
echo    Email:    demo@cluborax.com
echo    Password: demo123
echo.
echo 🔐 ADMIN ACCOUNT:
echo    Email:    admin@cluborax.com
echo    Password: (set during superuser creation above)
echo.
echo 📚 DOCUMENTATION:
echo    See SETUP_AND_SEED_DATA.md for detailed guide
echo.
echo ========================================
echo.
pause
