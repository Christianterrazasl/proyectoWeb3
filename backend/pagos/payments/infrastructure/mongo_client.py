import os
from pymongo import MongoClient
from pymongo.errors import ConfigurationError

# Conexión Singleton a MongoDB
# Toma automáticamente la URI de nuestro archivo .env
client = MongoClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017'))

# Seleccionamos la base de datos y la colección
database_name = os.getenv('MONGO_DB_NAME')

if database_name:
    db = client[database_name]
else:
    try:
        db = client.get_default_database()
    except ConfigurationError:
        db = client['payments']

transactions_collection = db['transactions_read_model']
