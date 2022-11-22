FROM node:16.18-slim as base
RUN apt-get update

RUN npm install -g node-pre-gyp
RUN npm install -g wrtc

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install

COPY . .

FROM base as production
ENV NODE_PATH=/.build
RUN npm run build
RUN npm run cli:install