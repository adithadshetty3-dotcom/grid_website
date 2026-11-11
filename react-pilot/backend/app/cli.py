"""Commands for explicitly provisioning Timeline admin users."""

import re

import click
from flask import current_app
from flask.cli import with_appcontext
from werkzeug.security import generate_password_hash

from .extensions import db
from .models import Admin


@click.command("create-admin")
@click.option("--username", prompt=True, help="Username for the Timeline admin account.")
@with_appcontext
def create_admin_command(username: str) -> None:
    """Create an admin interactively without exposing passwords in shell history."""
    normalized = username.strip()
    if not re.fullmatch(r"[A-Za-z0-9._-]{1,80}", normalized):
        raise click.ClickException("Username may contain only letters, digits, dots, underscores and hyphens (1 to 80 characters).")
    if db.session.scalar(db.select(Admin).where(db.func.lower(Admin.username) == normalized.lower())):
        raise click.ClickException("An admin with that username already exists.")

    password = click.prompt("Password", hide_input=True, confirmation_prompt=True)
    minimum = current_app.config["ADMIN_MIN_PASSWORD_LENGTH"]
    maximum = current_app.config["ADMIN_MAX_PASSWORD_LENGTH"]
    if not minimum <= len(password) <= maximum:
        raise click.ClickException(f"Password must be between {minimum} and {maximum} characters long.")

    admin = Admin(username=normalized, password_hash=generate_password_hash(password, method="scrypt"))
    db.session.add(admin)
    db.session.commit()
    click.echo(f"Timeline admin '{normalized}' created.")


def register_cli(app) -> None:
    app.cli.add_command(create_admin_command)
