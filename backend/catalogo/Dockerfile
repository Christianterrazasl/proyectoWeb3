# Usamos una imagen de Node.js ligera
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiamos solo los archivos de dependencias primero (optimiza la caché de Docker)
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código fuente
COPY . .

# Exponemos el puerto que usa nuestra API
EXPOSE 3000

# Comando por defecto para iniciar la app (modo desarrollo)
CMD ["npm", "run", "dev"]
