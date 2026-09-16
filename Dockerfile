FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

ENV NODE_ID=nodo PORT=3000 PEERS=""

EXPOSE 3000

CMD ["node", "src/index.js"]
