# syntax=docker/dockerfile:1

FROM node:16.14.2

ENV NODE_ENV=development

WORKDIR /home/express/sepaket

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "dev" ]
