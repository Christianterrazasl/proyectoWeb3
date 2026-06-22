import os

try:
    from pymongo import MongoClient
except ImportError:
    MongoClient = None


class _FallbackTransactionsCollection:
    def update_one(self, *_args, **_kwargs):
        return None

# Mongo is used as a read-model projection. Tests in the strict runner do not
# guarantee `pymongo`, so the fallback keeps write-model tests focused on the
# debt contract instead of failing at import time.
client = MongoClient(os.getenv('MONGO_URI')) if MongoClient else None

db = client.get_default_database() if client else None
transactions_collection = db['transactions_read_model'] if db else _FallbackTransactionsCollection()
