FROM node:22-alpine 

WORKDIR /

COPY package*.json ./

RUN npm install --production

COPY . .

RUN npm run build 

EXPOSE 3000