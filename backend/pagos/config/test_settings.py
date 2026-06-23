from .settings import *
import os


SECRET_KEY = SECRET_KEY or 'test-secret-key'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

os.environ.setdefault('MONGO_URI', 'mongodb://localhost:27017')
os.environ.setdefault('MONGO_DB_NAME', 'payments_test')
