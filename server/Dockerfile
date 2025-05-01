FROM node:18-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
ENV PORT=8080
EXPOSE 8080

# Command to run the application
CMD ["node", "src/index.js"]