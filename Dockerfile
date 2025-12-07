# Use Node.js 22 as base image
FROM node:22-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json pnpm-lock.yaml ./

# Copy pnpm workspace and patches if they exist
COPY pnpm-workspace.yaml* ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

# Build the application
RUN pnpm build

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
