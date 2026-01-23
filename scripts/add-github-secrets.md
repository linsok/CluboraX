# Adding GitHub Secrets for CI/CD

## 🚨 IMPORTANT: Add These Secrets Before Using CI/CD

Your CI/CD pipeline will fail without these secrets. Follow these steps exactly:

## 📍 Navigate to Secrets Settings

1. Go to your GitHub repository: `https://github.com/linsok/CluboraX`
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** button

## 🔑 Required Secrets (Add All of These)

### **Staging Environment Secrets**

#### 1. STAGING_DB_PASSWORD
- **Name**: `STAGING_DB_PASSWORD`
- **Value**: `campus_staging_password_2024`
- **Description**: MySQL password for staging database

#### 2. STAGING_DB_ROOT_PASSWORD  
- **Name**: `STAGING_DB_ROOT_PASSWORD`
- **Value**: `root_staging_password_2024`
- **Description**: MySQL root password for staging

#### 3. STAGING_SECRET_KEY
- **Name**: `STAGING_SECRET_KEY`
- **Value**: `django-insecure-staging-key-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`
- **Description**: Django secret key for staging environment

### **Production Environment Secrets**

#### 4. PROD_DB_NAME
- **Name**: `PROD_DB_NAME`
- **Value**: `campus_management_prod`
- **Description**: Production database name

#### 5. PROD_DB_USER
- **Name**: `PROD_DB_USER`
- **Description**: `campus_prod_user`

#### 6. PROD_DB_PASSWORD
- **Name**: `PROD_DB_PASSWORD`
- **Value**: `secure_prod_password_2024!@#`
- **Description**: Production database password (use a strong password)

#### 7. PROD_DB_ROOT_PASSWORD
- **Name**: `PROD_DB_ROOT_PASSWORD`
- **Value**: `very_strong_root_password_2024!@#$`
- **Description**: Production MySQL root password (use a very strong password)

#### 8. PROD_SECRET_KEY
- **Name**: `PROD_SECRET_KEY`
- **Value**: `django-super-secure-production-key-xyz987abc654def321ghi987jkl654mno321pqr987stu654vwx321yz`
- **Description**: Django secret key for production (use a long, random string)

#### 9. PROD_ALLOWED_HOSTS
- **Name**: `PROD_ALLOWED_HOSTS`
- **Value**: `localhost,127.0.0.1,yourdomain.com,www.yourdomain.com`
- **Description**: Replace `yourdomain.com` with your actual domain

## 🔧 Step-by-Step Instructions

### For Each Secret:

1. **Click "New repository secret"**
2. **Enter the exact name** (case-sensitive, no spaces)
3. **Paste the value** exactly as shown above
4. **Click "Add secret"**

### Repeat for all 9 secrets!

## ⚠️ Important Notes

- **Don't skip any secrets** - the pipeline will fail
- **Use the exact names** - case-sensitive
- **For production passwords**, consider using stronger passwords
- **For PROD_ALLOWED_HOSTS**, replace with your actual domain
- **Keep these secrets secure** - don't share them

## 🧪 Test After Adding Secrets

Once all secrets are added:

1. **Push to develop branch** to test staging deployment
2. **Check Actions tab** to see pipeline running
3. **Verify deployment** succeeds

## 🔍 Verify Secrets Are Added

After adding all secrets, you should see:
- 3 staging secrets
- 6 production secrets
- Total: 9 repository secrets

## 🚀 Ready to Deploy

Once all secrets are configured, your CI/CD pipeline is ready to use!

```bash
# Test staging deployment
git checkout develop
git add .
git commit -m "Test CI/CD setup"
git push origin develop

# Test production deployment (after staging works)
git checkout main
git merge develop
git push origin main
```

---

**🎯 Next: Add these 9 secrets, then your CI/CD will work automatically!**
