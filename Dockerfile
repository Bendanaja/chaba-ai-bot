FROM node:22-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY public ./public

RUN npx tsc

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/index.js"]
