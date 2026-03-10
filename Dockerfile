FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY public ./public
COPY server ./server
COPY src ./src

ENV PORT=8000
EXPOSE 8000

CMD ["npm", "start"]
