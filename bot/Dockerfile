FROM node:current-slim

WORKDIR /glitch_bot
COPY package.json .

RUN npm install 
RUN npm build
RUN npm run build

CMD ["node", "dist/main.js"]

COPY . .
