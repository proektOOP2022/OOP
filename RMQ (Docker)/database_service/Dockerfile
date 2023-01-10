FROM node:12
WORKDIR /usr/src/app/database

COPY ./database_service/package.json ./
COPY ./database_service/database_service.js ./
COPY ./config.json ./
RUN npm install

CMD [ "npm", "start" ]