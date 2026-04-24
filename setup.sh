#!/bin/bash

# ========================================
# Club & Event Management System Setup
# For Linux/Mac Users  
# ========================================

set -e

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  🚀 Club & Event Management System Setup   ║"
echo "║  Linux/Mac Setup Script                    ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found!"
    echo "📥 Please install Python 3.8 or higher"
    exit 1
fi

python3 --version
echo "✅ Python found"
echo ""

# Navigate to backend
cd backend || exit 1

# Step 1: Database Migration
echo "1️⃣  Running database migrations..."
python3 manage.py migrate
echo "✅ Migration complete"
echo ""

# Step 2: Create Superuser
echo "2️⃣  Creating admin superuser..."
echo "📧 Follow the prompts below:"
echo ""
python3 manage.py createsuperuser
echo ""

# Step 3: Seed Demo Data
echo "3️⃣  Seeding demo data..."
if python3 manage.py seed_demo_data; then
    echo "✅ Demo data created successfully"
else
    echo "⚠️  Demo data seeding had issues (check output above)"
fi
echo ""

# Return to root
cd ..

# Step 4: Install Frontend Dependencies
echo "4️⃣  Installing frontend dependencies..."
cd frontend || exit 1
if npm install; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  NPM install had issues"
fi
cd ..
echo ""

# Show final instructions
clear
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║            ✅ Setup Complete!              ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📝 NEXT STEPS:"
echo ""
echo "1. START BACKEND (run in one terminal):"
echo "   cd backend"
echo "   python3 manage.py runserver"
echo ""
echo "2. START FRONTEND (run in another terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. ACCESS THE APPLICATION:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8888"
echo "   Admin:    http://localhost:8888/admin"
echo ""
echo "👤 TEST ACCOUNT:"
echo "   Email:    demo@cluborax.com"
echo "   Password: demo123"
echo ""
echo "🔐 ADMIN ACCOUNT:"
echo "   Email:    admin@cluborax.com"
echo "   Password: (set during superuser creation above)"
echo ""
echo "📚 DOCUMENTATION:"
echo "   See SETUP_AND_SEED_DATA.md for detailed guide"
echo ""
echo "========================================"
echo ""
