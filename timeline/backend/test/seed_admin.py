"""Seed a throwaway parity-test DB; never use against a developer database."""

import os

from app import create_app
from app.extensions import db
from app.models import Admin
from werkzeug.security import generate_password_hash

app = create_app()
with app.app_context():
    username = os.environ["PARITY_TEST_USERNAME"]
    password = os.environ["PARITY_TEST_PASSWORD"]
    db.session.add(Admin(username=username, password_hash=generate_password_hash(password, method="scrypt")))
    db.session.commit()
