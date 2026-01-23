# CI/CD Usage Guide

## 🚀 Quick Start

Your CI/CD pipeline is ready to use! Here's how to get started:

## 📋 Prerequisites

1. **GitHub Repository** with your code pushed
2. **Docker** installed on your deployment server
3. **GitHub Secrets** configured (see below)

## 🔧 Setup Required GitHub Secrets

Go to **Settings** → **Secrets and variables** → **Actions** in your GitHub repository and add these secrets:

### For Staging Environment:
- `STAGING_DB_PASSWORD`: MySQL password for staging
- `STAGING_DB_ROOT_PASSWORD`: MySQL root password for staging  
- `STAGING_SECRET_KEY`: Django secret key for staging

### For Production Environment:
- `PROD_DB_NAME`: Production database name
- `PROD_DB_USER`: Production database username
- `PROD_DB_PASSWORD`: Production database password
- `PROD_DB_ROOT_PASSWORD`: Production database root password
- `PROD_SECRET_KEY`: Django secret key for production
- `PROD_ALLOWED_HOSTS`: Your domain (e.g., `yourdomain.com,www.yourdomain.com`)

## 🎯 How to Use the Pipeline

### 1. **Push to Development Branch**
```bash
git checkout develop
git add .
git commit -m "Your changes"
git push origin develop
```
**Triggers**: Tests → Security Scan → Docker Build → **Staging Deployment**

### 2. **Push to Main/Master Branch**
```bash
git checkout main
git merge develop
git push origin main
```
**Triggers**: Tests → Security Scan → Docker Build → **Production Deployment**

### 3. **Pull Request**
```bash
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature
# Create PR in GitHub
```
**Triggers**: Tests only (no deployment)

## 🔄 Pipeline Stages

### **Stage 1: Testing**
- ✅ Backend tests (Django + MySQL + Redis)
- ✅ Frontend tests (Vitest + coverage)
- ✅ Code quality checks (ESLint, Prettier, Flake8)

### **Stage 2: Security**
- ✅ Vulnerability scanning (Trivy)
- ✅ Dependency audit (npm audit, pip audit)

### **Stage 3: Build & Deploy**
- ✅ Docker image building
- ✅ Push to GitHub Container Registry
- ✅ Deployment to staging/production
- ✅ Health checks

## 🐳 Local Development Setup

### 1. **Start Local Services**
```bash
docker-compose up -d db redis
```

### 2. **Run Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. **Run Frontend**
```bash
cd frontend
npm install
npm run dev
```

## 🔍 Monitoring & Logs

### **Check Pipeline Status**
- Go to **Actions** tab in GitHub
- Click on any workflow run to see details
- View logs for each step

### **Check Deployment Health**
```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend

# Health check
curl http://localhost:8000/health/
curl http://localhost/
```

## 🚨 Troubleshooting

### **Common Issues**

#### 1. **Tests Fail**
- Check if all dependencies are installed
- Verify database connection in CI environment
- Look at test logs in GitHub Actions

#### 2. **Deployment Fails**
- Check GitHub secrets are correctly set
- Verify Docker images were built successfully
- Check deployment server logs

#### 3. **Health Check Fails**
- Ensure all services are running
- Check database and Redis connections
- Verify port accessibility

### **Debug Commands**
```bash
# Check container status
docker-compose ps

# Restart services
docker-compose restart

# View recent logs
docker-compose logs --tail=50

# Enter container for debugging
docker-compose exec backend bash
docker-compose exec frontend sh
```

## 📊 Pipeline Optimization

### **Speed Up Builds**
- Dependencies are cached automatically
- Docker layers are optimized
- Tests run in parallel

### **Security Best Practices**
- Secrets are never logged
- Images are scanned for vulnerabilities
- Minimal base images used

## 🎉 Success Indicators

Your pipeline is working when you see:
- ✅ All green checkmarks in GitHub Actions
- ✅ Docker images pushed to `ghcr.io`
- ✅ Application accessible at your domain
- ✅ Health check endpoint responding

## 📞 Need Help?

1. **Check the logs** in GitHub Actions
2. **Review this guide** for common solutions
3. **Check container logs** on your deployment server
4. **Verify secrets** are correctly configured

---

**🚀 Your CI/CD is now ready to automate your deployments!**
