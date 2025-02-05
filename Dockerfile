# Use official Node.js image from Docker Hub
FROM node:14
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm cache clean --force && npm install
COPY . .
EXPOSE 80
CMD ["npm", "start"]
