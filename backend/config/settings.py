import os
import secrets
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BASE_DIR.parent
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY") or secrets.token_urlsafe(64)
DEBUG = os.environ.get("DJANGO_DEBUG", "0") == "1"
FOOD_LAB_ENABLED = os.environ.get("FOOD_LAB_ENABLED", "0") == "1"
ALLOWED_HOSTS = ["127.0.0.1", "localhost", "[::1]"]
ROOT_URLCONF = "config.urls"
INSTALLED_APPS = ["django.contrib.staticfiles"]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
DATABASES = {}
LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Fortaleza"
USE_TZ = True
STATIC_URL = "/static/"
STATICFILES_DIRS = [PROJECT_DIR / "static"]
FRONTEND_INDEX = PROJECT_DIR / "frontend" / "dist" / "index.html"
FRONTEND_ASSETS = PROJECT_DIR / "frontend" / "dist" / "assets"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"
