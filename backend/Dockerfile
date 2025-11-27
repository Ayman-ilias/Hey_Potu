FROM node:20-alpine

# Install build dependencies for native modules like sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
