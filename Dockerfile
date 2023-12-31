# syntax=docker/dockerfile:1

FROM node:18.14.2

ENV NODE_ENV=development

WORKDIR /home/express/sepaket

COPY ["package.json", "./"]

RUN npm install --production --no-optional

COPY . .

RUN npm uninstall bcrypt

RUN npm install bcrypt

EXPOSE 3000

CMD [ "npm", "run", "dev" ]
