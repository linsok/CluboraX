# Required GitHub Secrets for CI/CD

## Staging Environment Secrets
Add these secrets to your GitHub repository for staging deployments:

- `STAGING_DB_PASSWORD`: MySQL password for staging database
- `STAGING_DB_ROOT_PASSWORD`: MySQL root password for staging
- `STAGING_SECRET_KEY`: Django secret key for staging

## Production Environment Secrets
Add these secrets to your GitHub repository for production deployments:

- `PROD_DB_NAME`: Production database name
- `PROD_DB_USER`: Production database username  
- `PROD_DB_PASSWORD`: Production database password
- `PROD_DB_ROOT_PASSWORD`: Production database root password
- `PROD_SECRET_KEY`: Django secret key for production
- `PROD_ALLOWED_HOSTS`: Comma-separated list of allowed hosts for production

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name specified above

## Generating Secret Keys

Generate Django secret keys using:
```python
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

## Database Passwords

Use strong passwords for your databases. Consider using a password manager to generate secure passwords.
