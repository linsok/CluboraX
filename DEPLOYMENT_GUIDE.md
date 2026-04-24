# 🚀 Deployment Guide (Production)

## Quick Summary

This project is **production-ready**. Here's what to do:

---

## 🔧 Pre-Deployment Checklist

### 1. Code Review
```bash
# Make sure all changes are committed
git status  # Should be clean
git log     # Check latest commits

# No console.logs in production code
grep -r "console.log" frontend/src/
grep -r "print(" backend/apps/

# No TODO comments left
grep -r "TODO\|FIXME" backend/ frontend/
```

### 2. Environment Setup
```bash
# Create production .env file
cd backend
cat > .env << EOF
SECRET_KEY=your-strong-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

DB_ENGINE=django.db.backends.mysql
DB_NAME=campus_management
DB_USER=db_user
DB_PASSWORD=strong_password
DB_HOST=db.example.com
DB_PORT=3306
EOF
```

### 3. Dependency Installation
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
npm run build  # Creates optimized build
```

### 4. Database Migration
```bash
cd backend

# Apply all migrations
python manage.py migrate

# Seed initial data (optional)
python manage.py seed_demo_data

# Create admin account
python manage.py createsuperuser
```

### 5. Static Files
```bash
# Collect all static files
cd backend
python manage.py collectstatic --noinput

# Should output location of collected files
# Usually: backend/staticfiles/ or /var/www/static/
```

---

## 📍 Backend Deployment

### Option A: Gunicorn + Nginx

#### Install Gunicorn
```bash
cd backend
pip install gunicorn
```

#### Create Gunicorn service file
```bash
sudo nano /etc/systemd/system/clubevent.service
```

```ini
[Unit]
Description=Club Event Django Application
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/club_event/backend
ExecStart=/var/www/club_event/backend/venv/bin/gunicorn \
    --workers 3 \
    --worker-class sync \
    --bind 127.0.0.1:8000 \
    campus_management.wsgi:application
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Enable and start service
```bash
sudo systemctl daemon-reload
sudo systemctl enable clubevent
sudo systemctl start clubevent
sudo systemctl status clubevent
```

#### Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/clubevent.conf
```

```nginx
upstream clubevent_app {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Static files
    location /static/ {
        alias /var/www/club_event/backend/staticfiles/;
    }

    # Media files
    location /media/ {
        alias /var/www/club_event/backend/mediafiles/;
    }

    # Django app
    location / {
        proxy_pass http://clubevent_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

#### Enable Nginx configuration
```bash
sudo ln -s /etc/nginx/sites-available/clubevent.conf /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Option B: Docker Deployment

#### Docker Compose
```bash
# Already have docker-compose.yml in project
docker-compose -f docker-compose.yml up -d
```

#### Or manual Docker
```bash
# Build image
docker build -t clubevent:latest backend/

# Run container
docker run -d \
    -p 8000:8000 \
    -e DEBUG=False \
    -e SECRET_KEY=your-key \
    -v /var/mediafiles:/app/mediafiles \
    clubevent:latest
```

---

## 🎨 Frontend Deployment

### Build for Production
```bash
cd frontend
npm run build

# Creates 'dist' folder with optimized build
```

### Deploy to Netlify (Easiest)
```bash
npm install -g netlify-cli

netlify login
netlify init  # Follow prompts
netlify deploy --prod
```

### Deploy to Vercel
```bash
npm install -g vercel

vercel login
vercel  # Follow prompts
```

### Deploy to Nginx / Standalone Server
```bash
# Copy build folder to server
scp -r frontend/dist/* user@server:/var/www/clubevent/

# Configure Nginx to serve React (see example below)
```

#### Nginx for React SPA
```nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/clubevent;
    index index.html;

    location / {
        # SPA routing
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://clubevent_backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🗄️ Database Setup

### MySQL on Ubuntu
```bash
# Install MySQL
sudo apt-get install mysql-server

# Create database
mysql -u root -p
CREATE DATABASE campus_management;
CREATE USER 'db_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON campus_management.* TO 'db_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Test connection
mysql -u db_user -p campus_management
```

### CloudSQL (Google Cloud)
```sql
-- Create database
CREATE DATABASE campus_management;

-- Create user
CREATE USER 'db_user'@'%' IDENTIFIED BY 'strong_password';
GRANT ALL ON campus_management.* TO 'db_user'@'%';
```

### AWS RDS
1. Launch RDS MySQL instance
2. Create security group rules
3. Create database: `campus_management`
4. Create user with appropriate permissions
5. Update Django `.env` with RDS endpoint

---

## 🔐 SSL/HTTPS Setup

### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Verify SSL
```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew --dry-run
```

---

## 📊 Monitoring & Logging

### Django Logging
```python
# backend/campus_management/settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/clubevent/django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'INFO',
    },
}
```

### Monitor Services
```bash
# Check Gunicorn status
sudo systemctl status clubevent

# Check Nginx status
sudo systemctl status nginx

# View logs
tail -f /var/log/clubevent/django.log
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 🔄 Continuous Deployment (CI/CD)

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Build backend
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Build frontend
      run: |
        cd frontend
        npm install
        npm run build
    
    - name: Deploy to server
      env:
        DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
      run: |
        # SSH and deploy
        ssh -i $DEPLOY_KEY user@server "cd /var/www/clubevent && git pull && ./deploy.sh"
```

---

## 🚨 Post-Deployment

### Verify Everything Works
```bash
# Backend API
curl https://yourdomain.com/api/clubs/

# Frontend
curl https://yourdomain.com/

# Admin panel
curl https://yourdomain.com/admin/

# Check logs
sudo journalctl -u clubevent -n 50
sudo tail -f /var/log/nginx/access.log
```

### Set Up Backups
```bash
# Database backup (daily)
0 2 * * * mysqldump -u db_user -p club_event | gzip > /backup/db_$(date +\%Y\%m\%d).sql.gz

# Media files backup (weekly)
0 3 * * 0 tar czf /backup/media_$(date +\%Y\%m\%d).tar.gz /var/www/clubevent/backend/mediafiles/
```

### Health Checks
```bash
# Monitor uptime
watch -n 60 'curl -s https://yourdomain.com/api/health/ || echo "DOWN"'

# Alert on high memory
free -h | grep Mem
ps aux --sort=-%mem | head -5
```

---

## 🆘 Rollback Procedure

### If Deployment Fails
```bash
# Stop current version
sudo systemctl stop clubevent

# Go back to previous commit
cd /var/www/clubevent
git revert HEAD
git pull

# Restart
sudo systemctl start clubevent

# Check logs
sudo systemctl status clubevent -l
```

---

## 📞 Support & Resources

- **Documentation**: See SETUP_AND_SEED_DATA.md and QUICK_START_GUIDE.md
- **Logs Location**: `/var/log/clubevent/`
- **Database Backups**: `/backup/`
- **Media Files**: `/var/www/clubevent/backend/mediafiles/`
- **Emergency Contact**: Development team

---

## ⚡ Performance Tuning

### Database Optimization
```bash
# Check slow queries
mysql -u root -p campus_management
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SHOW VARIABLES LIKE 'slow_query%';
```

### Caching Layer (Redis)
```bash
# Install Redis
sudo apt-get install redis-server

# Configure Django
# backend/requirements.txt
django-redis

# settings.py
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
    }
}
```

### CDN for Static Files
```
# Use CloudFront or similar to serve:
- /static/ files
- /media/ files
- Frontend dist files
```

---

## 📋 Deployment Checklist

Before going live:
- [ ] All tests passing
- [ ] DEBUG = False in production
- [ ] SECRET_KEY is unique and strong
- [ ] Database backups configured
- [ ] SSL certificate installed
- [ ] Error logging configured
- [ ] Monitoring setup
- [ ] Nginx/Gunicorn configured
- [ ] Static files collected
- [ ] DNS updated
- [ ] Email notifications working
- [ ] Admin account created
- [ ] Initial data seeded
- [ ] Performance tested under load
- [ ] Security audit complete

---

## 🎉 Post-Launch

### Monitor for Issues
1. Check error logs daily
2. Monitor server resources
3. Test key workflows weekly
4. Keep backups current
5. Update dependencies monthly

### Schedule Maintenance
- **Daily**: Check logs
- **Weekly**: Test backups
- **Monthly**: Update packages
- **Quarterly**: Full security audit
- **Yearly**: Database optimization

---

**Status**: Ready for Production
**Last Updated**: 2024
**Version**: 1.0.0

*For detailed setup instructions, see SETUP_AND_SEED_DATA.md*

