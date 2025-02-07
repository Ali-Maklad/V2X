FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching purposes)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application
COPY . .

# Expose the port that your app will be running on
EXPOSE 3000

# Set the default command to run your app
CMD ["npm", "start"]
