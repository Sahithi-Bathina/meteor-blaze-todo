FROM node:20

ENV METEOR_ALLOW_SUPERUSER=true

RUN curl https://install.meteor.com/ | sh

WORKDIR /app

COPY . .

RUN meteor npm install

RUN meteor build ../build --directory --allow-superuser

WORKDIR /build/bundle/programs/server

RUN npm install

WORKDIR /build/bundle

ENV PORT=3000

CMD ["node", "main.js"]