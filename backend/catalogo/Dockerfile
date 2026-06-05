FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN sed -i 's/\r$//' /usr/src/app/entrypoint.sh && chmod +x /usr/src/app/entrypoint.sh

EXPOSE 3000

CMD ["/usr/src/app/entrypoint.sh"]
