#!/usr/bin/env python
"""
Alternative Python setup script for cross-platform compatibility
Run: python setup.py
"""

import os
import sys
import subprocess
import datetime
from pathlib import Path

def run_command(command, description, cwd=None):
    """Run a shell command and handle errors"""
    print(f"\n📌 {description}...")
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=False,
            text=True
        )
        if result.returncode != 0:
            print(f"❌ {description} failed!")
            return False
        print(f"✅ {description} complete!")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("""
    ╔════════════════════════════════════════════╗
    ║  🚀 Club & Event Management System Setup   ║
    ║  Auto-initialization & Demo Data Creator   ║
    ╚════════════════════════════════════════════╝
    """)
    
    project_root = Path(__file__).parent
    backend_path = project_root / "backend"
    frontend_path = project_root / "frontend"
    
    # Step 1: Database Migration
    choice = input("\n1️⃣  Run database migrations? (y/n): ").lower()
    if choice == 'y':
        run_command(
            "python manage.py migrate",
            "Running migrations",
            cwd=backend_path
        )
    
    # Step 2: Create Superuser
    choice = input("\n2️⃣  Create admin superuser? (y/n): ").lower()
    if choice == 'y':
        print("\n📧 Follow prompts to create admin account...")
        run_command(
            "python manage.py createsuperuser",
            "Creating superuser",
            cwd=backend_path
        )
    
    # Step 3: Seed Demo Data
    choice = input("\n3️⃣  Seed demo data (clubs, events, users)? (y/n): ").lower()
    if choice == 'y':
        run_command(
            "python manage.py seed_demo_data",
            "Seeding demo data",
            cwd=backend_path
        )
    
    # Step 4: Install Frontend Dependencies
    choice = input("\n4️⃣  Install frontend dependencies? (y/n): ").lower()
    if choice == 'y':
        run_command(
            "npm install",
            "Installing npm packages",
            cwd=frontend_path
        )
    
    # Summary
    print(f"""
    
    ╔════════════════════════════════════════════╗
    ║            ✅ Setup Complete!              ║
    ╚════════════════════════════════════════════╝
    
    📝 Next Steps:
    
    1. Start Backend:
       cd backend
       python manage.py runserver
    
    2. Start Frontend (new terminal):
       cd frontend
       npm run dev
    
    3. Access the application:
       Frontend: http://localhost:3000
       Backend:  http://localhost:8888
       Admin:    http://localhost:8888/admin
    
    👤 Demo Credentials:
       Email:    demo@cluborax.com
       Password: demo123
    
    🔐 Admin Credentials:
       Email:    admin@cluborax.com
       Password: (set during superuser creation)
    
    📚 Documentation: See SETUP_AND_SEED_DATA.md
    
    """)

if __name__ == "__main__":
    main()
