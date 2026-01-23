# Test CI/CD pipeline locally (PowerShell version)
Write-Host "🧪 Testing CI/CD Pipeline Locally" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Test backend
Write-Host ""
Write-Host "🐍 Testing Backend..." -ForegroundColor Yellow
Set-Location backend

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
}

# Activate virtual environment
& venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing dependencies..."
pip install -r requirements.txt

# Run tests
Write-Host "Running Django tests..."
python manage.py test --verbosity=2

# Run linting
Write-Host "Running flake8..."
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

Set-Location ..

# Test frontend
Write-Host ""
Write-Host "⚛️ Testing Frontend..." -ForegroundColor Yellow
Set-Location frontend

# Install dependencies
Write-Host "Installing dependencies..."
npm ci

# Run tests
Write-Host "Running tests..."
npm test -- --coverage --watchAll=false

# Run linting
Write-Host "Running ESLint..."
npm run lint

# Run Prettier check
Write-Host "Running Prettier check..."
npm run format:check

# Build frontend
Write-Host "Building frontend..."
npm run build

Set-Location ..

Write-Host ""
Write-Host "🎉 Local testing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Add GitHub secrets (see scripts/setup-secrets.md)" -ForegroundColor White
Write-Host "2. Push to develop branch to trigger staging deployment" -ForegroundColor White
Write-Host "3. Push to main branch to trigger production deployment" -ForegroundColor White
