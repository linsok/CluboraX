Listed directory Club_Event
Viewed DEPLOYMENT_GUIDE.md:1-575
Viewed docker-compose.yml:1-127

To host **CluboraX** successfully on **DigitalOcean**, the best and most robust method is to use a **DigitalOcean Droplet with Docker Compose**. 

Since your project contains multiple services (MySQL, Redis, Celery, Django Backend, React Frontend, and Ollama AI), running them inside Docker containers on a virtual private server (Droplet) keeps everything isolated and simple.

---

### Step 1: Choose the Right Droplet Size (Crucial for AI/OCR)
Because you are running local deep learning models (YOLO field detector, Kiri OCR, and Ollama LLM), your server needs enough memory:
* **Minimum:** **4 GB RAM / 2 CPUs** (Basic Plan, Premium Intel or AMD, $24/month).
* **Recommended:** **8 GB RAM / 4 CPUs** (Basic Plan, $48/month) for faster AI inference times.
> [!WARNING]
> Do **NOT** use the cheap $4 or $6 (512MB/1GB RAM) droplets. Running Docker build, loading OCR weights, and running Ollama will instantly freeze/crash the server due to Out-Of-Memory (OOM) errors.

---

### Step 2: Create the Droplet on DigitalOcean
1. Click **Create** (green button at top) -> **Droplets**.
2. **Choose Region:** Pick a location closest to your users.
3. **Choose Image:** Click the **Marketplace** tab, search for **Docker**, and select the **Docker on Ubuntu** image. This comes with `docker` and `docker-compose` pre-installed!
4. **Choose Size:** Select **Basic** -> **Premium Intel (or AMD)** -> **$24/month (4GB RAM / 2 CPUs)**.
5. **Authentication:** Choose **SSH Keys** (recommended) or create a strong **root password**.
6. Click **Create Droplet** and wait for it to boot. Copy its **Public IP Address**.

---

### Step 3: Configure Your Domain (Optional)
If you have a domain name (e.g., `cluborax.com`):
* Go to your domain provider (GoDaddy, Namecheap, etc.) and add an **A Record** pointing to your **Droplet's Public IP**.

---

### Step 4: SSH Into Droplet & Clone Project
Open your terminal (PowerShell, Git Bash, or Terminal) and run:
```bash
# SSH into your new server
ssh root@<your_droplet_ip>

# Navigate to the web hosting directory
cd /var/www

# Clone your GitHub repository
git clone https://github.com/linsok/CluboraX.git clubevent
cd clubevent
```

---

### Step 5: Adjust `docker-compose.yml` for Linux
In your `docker-compose.yml` file, the Ollama service has a Windows path configured for its volume:
* Line 34: ` - "C:/Users/User/.ollama:/root/.ollama"`

You **must** change this to a Linux path, otherwise the container will fail to start.
1. Open the file:
   ```bash
   nano docker-compose.yml
   ```
2. Locate the `ollama` service volumes block (around line 34) and change it to:
   ```yaml
       volumes:
         - "/root/.ollama:/root/.ollama"
   ```
3. Press `CTRL+O` then `Enter` to save, and `CTRL+X` to exit.

---

### Step 6: Upload the OCR Model Weights
Since your `.pt` and `.safetensors` model weights are ignored in Git (they are too large), you must upload them from your **local machine** to the server:

Run this command **on your local computer's terminal** (not inside SSH):
```powershell
# Upload the local ocr_models directory to your DigitalOcean droplet
scp -r d:\User\pp1\Club_Event\backend\ocr_models root@<your_droplet_ip>:/var/www/clubevent/backend/
```

---

### Step 7: Build and Run the App
Inside your SSH terminal on the Droplet, run:
```bash
cd /var/www/clubevent

# Build and start all Docker services in the background
docker compose up --build -d
```

To verify that all services are running:
```bash
docker compose ps
```

---

### Step 8: Initialize Database & AI Models
Run these commands inside your SSH terminal to run migrations, create your admin account, and pull your Ollama LLM model:

```bash
# 1. Run database migrations
docker exec -it campus_backend python manage.py migrate

# 2. Create the system admin account
docker exec -it campus_backend python manage.py createsuperuser

# 3. Download the Ollama model inside the Ollama container
docker exec -it campus_ollama ollama pull gemma3:1b
```

---

### Step 9: Configure Nginx Reverse Proxy & SSL (HTTPS)
To access the app over standard ports `80` (HTTP) and `443` (HTTPS) with a free SSL certificate:

1. Install Nginx and Certbot on the Droplet host:
   ```bash
   sudo apt update
   sudo apt install nginx certbot python3-certbot-nginx -y
   ```
2. Create an Nginx config file:
   ```bash
   sudo nano /etc/nginx/sites-available/cluborax
   ```
3. Paste this reverse proxy configuration (replace `yourdomain.com` with your public IP or domain name):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3000; # React frontend container
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:8000; # Django backend container
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```
4. Enable the configuration and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/cluborax /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```
5. Secure it with HTTPS:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```