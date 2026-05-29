import os
from pymongo import MongoClient

# Conexión Singleton a MongoDB
# Toma automáticamente la URI de nuestro archivo .env
client = MongoClient(os.getenv('MONGO_URI'))

# Seleccionamos la base de datos y la colección
db = client.get_default_database()
transactions_collection = db['transactions_read_model']