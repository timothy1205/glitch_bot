FROM node:current-slim

WORKDIR /glitch_bot
COPY package.json .
COPY yarn.lock .

RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

CMD ["node", "dist/main.js"]
