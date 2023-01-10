FROM python:3.9
WORKDIR /usr/src/app/analyzer

COPY ./road_analyzer/package.json ./
COPY ./road_analyzer/road_analyzer.js ./
COPY ./config.json ./

ADD ./road_analyzer/ml ./
COPY ./road_analyzer/requirements.txt ./

RUN apt-get update
RUN apt-get -y install curl
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt -y install nodejs
RUN npm install
RUN pip install --no-cache-dir -r requirements.txt

CMD [ "npm", "start" ]