FROM node/base:2

WORKDIR /app

COPY package.json .

COPY . .

ENV PORT=3000

EXPOSE $PORT

CMD ["npm", "run", "start"]
