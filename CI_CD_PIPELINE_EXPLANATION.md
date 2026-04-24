# CI/CD Pipeline Explanation - Line by Line

## **Header & Triggers (Lines 1-7)**

```yaml
name: CI/CD Pipeline
```
- **What it does:** Names this workflow "CI/CD Pipeline" - this is what appears in GitHub Actions
- **Why:** Identifies the pipeline in GitHub's action logs

```yaml
on:
  push:
    branches: [ main, develop, dev ]
  pull_request:
    branches: [ main, develop, dev ]
```
- **What it does:** Defines WHEN the pipeline runs
- **push branches:** Triggers when code is pushed to `main`, `develop`, or `dev` branches
- **pull_request branches:** Also triggers when a Pull Request is created against these branches
- **Why:** Ensures every code change is automatically tested before merging

---

## **Permissions (Lines 9-10)**

```yaml
permissions:
  security-events: write
```
- **What it does:** Grants permission to write security scan results
- **Why:** Allows the pipeline to upload vulnerability findings to GitHub's security tab

---

## **BACKEND TEST JOB (Lines 12-82)**

### **Job Definition**
```yaml
backend-test:
  runs-on: ubuntu-latest
```
- **What it does:** Creates a job named `backend-test` that runs on Ubuntu Linux
- **Why:** Tests happen on a clean Linux machine, not your local computer

### **Services (Lines 15-29)**

```yaml
services:
  mysql:
    image: mysql:8.0
    env:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: campus_management_test
      MYSQL_USER: test_user
      MYSQL_PASSWORD: test_password
    ports:
      - 3306:3306
    options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3
```
- **What it does:** Starts a MySQL database in a Docker container for tests
- **MYSQL_DATABASE:** Creates a test database called `campus_management_test`
- **MYSQL_USER:** Creates user `test_user` with password `test_password`
- **ports:** Makes MySQL available on port 3306
- **health-cmd:** Checks if database is alive every 10 seconds
- **Why:** Tests need a real database to run against

```yaml
redis:
  image: redis:7-alpine
  ports:
    - 6379:6379
```
- **What it does:** Starts a Redis cache server for the tests
- **Why:** Application needs Redis for caching/sessions

### **Steps - Checkout Code**
```yaml
- name: Checkout code
  uses: actions/checkout@v4
```
- **What it does:** Downloads your repository code
- **Why:** Pipeline needs to access your source code files

### **Steps - Set Up Python**
```yaml
- name: Set up Python
  uses: actions/setup-python@v4
  with:
    python-version: '3.11'
```
- **What it does:** Installs Python 3.11
- **Why:** Backend is a Python/Django project

### **Steps - Cache Dependencies**
```yaml
- name: Cache pip dependencies
  uses: actions/cache@v3
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('backend/requirements.txt') }}
    restore-keys: |
      ${{ runner.os }}-pip-
```
- **What it does:** Caches Python packages to avoid re-downloading them
- **key:** Uses `requirements.txt` file hash to determine if cache is valid
- **Why:** Speeds up pipeline (don't download same packages repeatedly)

### **Steps - Install Dependencies**
```yaml
- name: Install dependencies
  run: |
    cd backend
    python -m pip install --upgrade pip
    pip install -r requirements.txt
```
- **What it does:** Installs all Python packages needed for the backend
- **python -m pip install --upgrade pip:** Updates pip (package manager)
- **pip install -r requirements.txt:** Installs packages listed in requirements.txt
- **Why:** Project won't run without its dependencies

### **Steps - Run Migrations**
```yaml
- name: Run Django migrations
  run: |
    cd backend
    python manage.py migrate --settings=campus_management.settings_ci
  env:
    DJANGO_SETTINGS_MODULE: campus_management.settings_ci
    DB_HOST: 127.0.0.1
    DB_NAME: campus_management_test
    DB_USER: test_user
    DB_PASSWORD: test_password
    SECRET_KEY: test-secret-key-for-ci
```
- **What it does:** Sets up test database with Django migrations
- **migrate:** Creates all database tables
- **env section:** Sets environment variables the Django app needs
  - Points to MySQL test database
  - Uses test credentials
- **Why:** Database must be initialized before running tests

### **Steps - Run Tests**
```yaml
- name: Run backend tests
  run: |
    cd backend
    python manage.py test --settings=campus_management.settings_ci --verbosity=2
  env:
    [same environment variables as migration step]
```
- **What it does:** Runs all Django unit tests
- **--verbosity=2:** Shows detailed output
- **Why:** Catches bugs before code reaches production

### **Steps - Code Quality Checks**
```yaml
- name: Run code quality checks
  run: |
    cd backend
    pip install flake8 black isort
    flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
    flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
    isort --check-only --diff . || echo "Import sorting issues found"
```
- **flake8:** Checks for syntax errors and code problems
  - `--select=E9,F63,F7,F82`: Checks specific error types (critical issues)
  - Second flake8 run: Checks code complexity (max-complexity=10) and line length
- **isort:** Checks if Python imports are properly organized
- **Why:** Ensures code follows style standards and is maintainable

---

## **FRONTEND TEST JOB (Lines 84-115)**

### **Setup**
```yaml
frontend-test:
  runs-on: ubuntu-latest
```
- Same as backend: runs on Ubuntu Linux

### **Node.js Setup**
```yaml
- name: Set up Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'
    cache-dependency-path: frontend/package-lock.json
```
- **What it does:** Installs Node.js 18
- **cache: 'npm':** Caches npm packages like backend caches pip
- **Why:** Frontend is a JavaScript project

### **Install Dependencies**
```yaml
- name: Install dependencies
  run: |
    cd frontend
    npm ci
```
- **npm ci:** Installs exact versions from package-lock.json
- **Why:** Same dependencies as development ensure consistent behavior

### **Run Tests**
```yaml
- name: Run frontend tests
  run: |
    cd frontend
    npm run test -- --run --coverage --passWithNoTests
  env:
    CI: true
```
- **--run:** Runs tests once and exits (not watching mode)
- **--coverage:** Generates code coverage report
- **CI: true:** Tells test framework we're in CI environment
- **Why:** Verifies frontend code works

### **Linting**
```yaml
- name: Run linting
  run: |
    cd frontend
    npm run lint || echo "Linting completed with warnings"
```
- **npm run lint:** Checks code style/quality
- **|| echo:** If linting fails, prints message but continues pipeline
- **Why:** Identifies code quality issues (but doesn't block deployment)

### **Build Frontend**
```yaml
- name: Build frontend
  run: |
    cd frontend
    npm run build
```
- **What it does:** Bundles React code for production
- **Why:** Tests that code can be compiled/bundled successfully

---

## **DOCKER BUILD JOB (Lines 117-155)**

```yaml
docker-build:
  runs-on: ubuntu-latest
  needs: [backend-test, frontend-test]
```
- **needs:** This job only runs AFTER backend-test and frontend-test succeed
- **Why:** Don't build Docker images if tests fail

### **Docker Setup**
```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
```
- **What it does:** Enables advanced Docker building features
- **Why:** Allows parallel builds and better caching

### **Build Backend Image**
```yaml
- name: Build backend Docker image
  uses: docker/build-push-action@v5
  with:
    context: ./backend
    file: ./backend/Dockerfile
    push: false
    tags: cluborax-backend:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```
- **context:** Builds from `backend` folder
- **file:** Uses `backend/Dockerfile`
- **push: false:** Builds but doesn't push to registry (just testing)
- **tags:** Names image as `cluborax-backend:latest`
- **cache-from/cache-to:** Caches layers between builds
- **Why:** Ensures Docker image can be built without errors

### **Test Docker Compose**
```yaml
- name: Test Docker Compose
  run: |
    docker compose config --quiet
    docker compose build --parallel
```
- **docker compose config --quiet:** Validates docker-compose.yml
- **docker compose build --parallel:** Builds all containers in parallel
- **Why:** Confirms entire application stack can be built

---

## **SECURITY SCAN JOB (Lines 157-187)**

```yaml
security-scan:
  runs-on: ubuntu-latest
  needs: [backend-test, frontend-test]
```
- Runs after tests succeed

### **Trivy Scanner**
```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: '.'
    format: 'sarif'
    output: 'trivy-results.sarif'
```
- **What it does:** Scans entire repository for vulnerabilities
- **scan-type: 'fs':** Filesystem scan (checks all files)
- **scan-ref: '.':** Scans current directory
- **format: 'sarif':** Outputs in SARIF format (GitHub understands this)
- **Why:** Finds security vulnerabilities in dependencies

### **Upload Results**
```yaml
- name: Upload Trivy scan results
  uses: github/codeql-action/upload-sarif@v4
  if: always()
  with:
    sarif_file: 'trivy-results.sarif'
```
- **if: always():** Uploads results even if scan found issues
- **Why:** Security findings appear in GitHub's Security tab

### **Python Safety Check**
```yaml
- name: Run safety check for Python dependencies
  run: |
    cd backend
    pip install safety
    safety check || echo "Security vulnerabilities found but continuing pipeline"
```
- **safety check:** Checks Python packages for known vulnerabilities
- **|| echo:** If vulnerabilities found, prints message but continues
- **Why:** Alerts about outdated/unsafe packages

---

## **DEPLOY JOB (Lines 189-243)**

```yaml
deploy:
  runs-on: ubuntu-latest
  needs: [backend-test, frontend-test, docker-build, security-scan]
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```
- **needs:** Only runs if ALL previous jobs pass
- **if condition:** ONLY runs when:
  - Code is pushed to `main` branch (not pull requests)
  - AND it's a push event (not pull request)
- **Why:** Only deploy to production on main branch after all checks pass

### **AWS Credentials**
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ secrets.AWS_REGION }}
```
- **What it does:** Logs into AWS account
- **secrets.*** : Retrieves secrets stored in GitHub (not visible in code)
- **Why:** Needs AWS credentials to deploy

### **Login to ECR**
```yaml
- name: Login to Amazon ECR
  id: login-ecr
  uses: aws-actions/amazon-ecr-login@v2
```
- **What it does:** Logs into AWS container registry (ECR)
- **id: login-ecr:** Saves output for later use
- **Why:** Needs to push Docker images to AWS

### **Build & Push Backend Image**
```yaml
- name: Build and push backend image
  env:
    ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
    ECR_REPOSITORY: cluborax-backend
    IMAGE_TAG: ${{ github.sha }}
  run: |
    docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
    docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
    docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
    docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
```
- **IMAGE_TAG:** Uses git commit SHA (unique identifier)
- **docker build:** Creates image with commit SHA tag
- **docker push:** Pushes to AWS ECR
- **docker tag:** Also tags as `latest`
- **Why:** Creates versioned images for deployment

### **Build & Push Frontend Image**
- Same process as backend but for frontend folder

### **Deploy to Production**
```yaml
- name: Deploy to production
  run: |
    aws ecs update-service --cluster ${{ secrets.ECS_CLUSTER }} --service ${{ secrets.ECS_SERVICE }} --force-new-deployment
```
- **What it does:** Updates AWS ECS service with new Docker images
- **force-new-deployment:** Restarts containers with new images
- **Why:** Deploys updated application to production servers

---

## **PERFORMANCE TEST JOB (Lines 245-272)**

```yaml
performance-test:
  runs-on: ubuntu-latest
  needs: [backend-test, frontend-test]
  if: github.event_name == 'pull_request'
```
- **if:** Only runs on Pull Requests (not main branch)
- **Why:** Tests performance impact of changes before merging

### **Locust Setup**
```yaml
- name: Install Locust
  run: pip install locust
```
- **Locust:** Load testing framework (simulates many users)

### **Run Performance Tests**
```yaml
- name: Run performance tests
  run: |
    printf 'from locust import HttpUser, task\n\nclass WebsiteUser(HttpUser):\n    @task\n    def index_page(self):\n        self.client.get("/")\n' > locustfile.py
    locust --headless --users 10 --spawn-rate 1 --run-time 30s --host http://localhost:8000
```
- **Creates locustfile.py:** A test that simulates user requests
- **--users 10:** Simulates 10 concurrent users
- **--spawn-rate 1:** Adds 1 new user per second
- **--run-time 30s:** Runs for 30 seconds
- **Why:** Ensures changes don't slow down the application

---

## **COVERAGE JOB (Lines 274-290)**

```yaml
coverage:
  runs-on: ubuntu-latest
  needs: [backend-test, frontend-test]
```
- Runs after tests complete

### **Upload Coverage**
```yaml
- name: Upload backend coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./backend/coverage.xml
    flags: backend
    name: backend-coverage

- name: Upload frontend coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./frontend/coverage/lcov.info
    flags: frontend
    name: frontend-coverage
```
- **What it does:** Uploads test coverage reports to Codecov service
- **coverage.xml / lcov.info:** Test coverage reports showing % of code tested
- **flags:** Categorizes reports (backend vs frontend)
- **Why:** Tracks code coverage over time; shows if new code is tested

---

## **Summary - Pipeline Flow**

```
┌─────────────────┐
│  Code Pushed    │
│  to main/dev    │
└────────┬────────┘
         │
         ├──────────────────────────────────────────┐
         │                                          │
    ┌────▼────┐                            ┌───────▼────┐
    │ Backend  │                            │  Frontend  │
    │  Tests   │                            │   Tests    │
    └────┬────┘                            └───────┬────┘
         │                                         │
         └────────────────┬──────────────────────┘
                          │
                    ┌─────▼──────┐
                    │  Security  │
                    │   Scans    │
                    └─────┬──────┘
                          │
                    ┌─────▼──────┐
                    │   Docker   │
                    │   Build    │
                    └─────┬──────┘
                          │
               ┌──────────▼──────────┐
               │                     │
    ┌──────────▼────────┐   ┌───────▼────────┐
    │ Performance Test  │   │    Coverage    │
    │ (PR only)        │   │    Report      │
    └──────────────────┘   └────────────────┘
               │
    ┌──────────▼──────────┐
    │  Deploy to Prod     │
    │  (main only)        │
    └─────────────────────┘
```

---

## **Key Concepts to Remember**

| Concept | What It Does |
|---------|------------|
| **CI (Continuous Integration)** | Automatically tests every code change |
| **CD (Continuous Deployment)** | Automatically deploys tested code to production |
| **Jobs** | Separate tasks that can run in parallel |
| **needs** | Makes one job wait for another to finish |
| **Services** | Extra software (MySQL, Redis) needed for tests |
| **Secrets** | Passwords/keys stored safely in GitHub |
| **if condition** | Controls when a job runs |
| **Artifacts** | Files created by the pipeline (test reports, coverage) |

---

## **What Each Job Does - Quick Reference**

### 1. **backend-test**
   - Sets up MySQL and Redis databases
   - Installs Python dependencies
   - Runs Django migrations
   - Executes all unit tests
   - Checks code quality (flake8, isort)
   - ⏱️ Time: ~5-10 minutes

### 2. **frontend-test**
   - Installs Node.js 18
   - Installs npm dependencies
   - Runs JavaScript tests
   - Checks code linting
   - Builds production bundle
   - ⏱️ Time: ~3-5 minutes

### 3. **docker-build**
   - Builds Docker image for backend
   - Builds Docker image for frontend
   - Validates docker-compose.yml
   - Requires: backend-test & frontend-test to pass
   - ⏱️ Time: ~5-8 minutes

### 4. **security-scan**
   - Runs Trivy vulnerability scanner on all files
   - Checks Python packages for security issues
   - Uploads findings to GitHub Security tab
   - Requires: backend-test & frontend-test to pass
   - ⏱️ Time: ~2-3 minutes

### 5. **deploy**
   - **ONLY** runs when code is pushed to `main` branch
   - Logs into AWS
   - Builds and pushes Docker images to ECR
   - Updates ECS service with new images
   - Requires: All other jobs to pass
   - ⏱️ Time: ~10-15 minutes

### 6. **performance-test**
   - **ONLY** runs on Pull Requests
   - Simulates 10 users making requests
   - Runs for 30 seconds
   - Ensures changes don't slow app down
   - ⏱️ Time: ~1-2 minutes

### 7. **coverage**
   - Uploads test coverage reports to Codecov
   - Shows % of code that has tests
   - Tracks coverage trends over time
   - ⏱️ Time: ~1 minute

---

## **Common Questions**

### Q: Why are there so many jobs?
**A:** Each job tests different aspects:
- **backend-test**: Code correctness & quality
- **frontend-test**: User interface & interactivity
- **docker-build**: Deployment readiness
- **security-scan**: Vulnerabilities & dangerous packages
- **performance-test**: Speed impact
- **coverage**: Test quality

### Q: When does code get deployed?
**A:** ONLY when:
1. Code is pushed to `main` branch (not develop/dev)
2. ALL jobs pass (tests, security, docker build)
3. Automatically without manual approval

### Q: What happens if tests fail?
**A:** Pipeline stops immediately. Docker build, security scan, and deployment are skipped. Developer must fix issues and push again.

### Q: How long does the pipeline take?
**A:** ~20-30 minutes total (most jobs run in parallel):
- Backend + Frontend tests: ~10 min (parallel)
- Docker build: ~8 min (after tests)
- Security scan: ~3 min (parallel with docker)
- Coverage: ~1 min
- Deploy: ~15 min (only on main)

### Q: Can I see the pipeline results?
**A:** Yes! Go to GitHub → Actions tab → Choose workflow → See logs & results

---

## **Troubleshooting Guide**

| Issue | Solution |
|-------|----------|
| Backend tests fail | Check `django test` error logs, database connection |
| Frontend tests fail | Check `npm test` output, missing dependencies |
| Docker build fails | Check Dockerfile syntax, missing files |
| Security scan fails | Update vulnerable packages in requirements.txt |
| Deploy fails | Check AWS credentials in GitHub secrets |
| Performance slow | Check if changes added expensive operations |

---

This CI/CD pipeline is the backbone of automated quality assurance. Every push triggers automatic testing and security checks, ensuring only safe, tested code reaches production! 🚀
