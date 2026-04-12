FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY webpack.config.js babel.config.json tsconfig.json tsconfig.server.json eslint.config.mjs ./
COPY public ./public
COPY server ./server
COPY src ./src

RUN npm run build

ENV PORT=8000
EXPOSE 8000

CMD ["npm", "start"]
