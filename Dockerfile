FROM node:latest as base

RUN npm install -g node-pre-gyp
RUN npm install -g wrtc

WORKDIR /home

COPY package*.json ./

RUN npm install

COPY . .

FROM base as production
ENV NODE_PATH=/.build
EXPOSE 9000 10000
RUN npm run build