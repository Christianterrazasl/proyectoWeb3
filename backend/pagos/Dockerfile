# Usamos una versión ligera de Python oficial
FROM python:3.11-slim

# Evita que Python genere archivos .pyc basura y manda los logs directo a la consola
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos primero los requerimientos para aprovechar la caché de Docker
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto de tu código
COPY . /app/

# Exponemos el puerto de Django
EXPOSE 8000

# Comando para levantar el servidor
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]