FROM node:12

WORKDIR /usr/src/app/analyzer

COPY ./road_analyzer/package.json ./
COPY ./road_analyzer/road_analyzer.js ./
COPY ./config.json ./
RUN npm install

CMD [ "npm", "start" ]