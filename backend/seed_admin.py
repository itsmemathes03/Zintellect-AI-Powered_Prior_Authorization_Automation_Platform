"""
Seed script: Creates the first admin user.

Usage:
  python seed_admin.py                          # interactive prompt
  python seed_admin.py --auto                   # default admin@gmail.com / admin123

The admin is stored in the `users` table with role="Admin".
Run this after starting the backend at least once (to create the DB tables).
"""

import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database.db import SessionLocal
from app.models.user_model import User
from app.services.auth_service import hash_password
import uuid


def seed_admin(email=None, password=None):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.role == "Admin").first()
        if existing:
            print(f"[seed_admin] Admin user already exists: {existing.email}")
            return

        if not email:
            email = input("Admin email [admin@gmail.com]: ") or "admin@gmail.com"
        if not password:
            password = input("Admin password [admin123]: ") or "admin123"

        admin = User(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=hash_password(password),
            role="Admin",
            first_name="System",
            last_name="Admin",
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        db.commit()
        print(f"[seed_admin] Admin user created: {email}")
        print(
            f"[seed_admin] Login at /admin-login with email={email} password={password}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create the first admin user")
    parser.add_argument("--auto", action="store_true", help="Use default credentials")
    args = parser.parse_args()

    if args.auto:
        seed_admin(email="admin@gmail.com", password="admin123")
    else:
        seed_admin()
