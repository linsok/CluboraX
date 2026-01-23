#!/bin/bash

# Test CI/CD pipeline locally
echo "🧪 Testing CI/CD Pipeline Locally"
echo "================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Test backend
echo ""
echo "🐍 Testing Backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run tests
echo "Running Django tests..."
python manage.py test --verbosity=2

# Run linting
echo "Running flake8..."
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

cd ..

# Test frontend
echo ""
echo "⚛️ Testing Frontend..."
cd frontend

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run tests
echo "Running tests..."
npm test -- --coverage --watchAll=false

# Run linting
echo "Running ESLint..."
npm run lint

# Run Prettier check
echo "Running Prettier check..."
npm run format:check

# Build frontend
echo "Building frontend..."
npm run build

cd ..

echo ""
echo "🎉 Local testing complete!"
echo ""
echo "Next steps:"
echo "1. Add GitHub secrets (see scripts/setup-secrets.md)"
echo "2. Push to develop branch to trigger staging deployment"
echo "3. Push to main branch to trigger production deployment"
