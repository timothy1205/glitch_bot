FROM node:current-slim

WORKDIR /glitch_bot
COPY package.json .

RUN npm install 
COPY . .
RUN npm run build

CMD ["node", "dist/main.js"]
