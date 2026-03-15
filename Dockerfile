# Use Node.js 24.12.0 as base image
FROM node:24.12.0-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy application source
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --omit=dev

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
