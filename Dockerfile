FROM node/base:2

WORKDIR /app

COPY package.json .

RUN npm install --omit=dev

COPY . .

ENV PORT=3000

EXPOSE $PORT

CMD ["npm", "run", "start"]
