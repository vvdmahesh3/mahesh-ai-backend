FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

ENV PORT=5174

CMD ["node", "ai-server/server.js"]
