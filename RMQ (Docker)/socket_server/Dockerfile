FROM node:12
WORKDIR /usr/src/app/server

COPY ./socket_server/package.json ./
COPY ./socket_server/socket_server.js ./
COPY ./socket_server/extra_process.js ./
COPY ./config.json ./
ADD ./socket_server/site ./site

RUN npm install

EXPOSE 8000
CMD [ "npm", "start" ]