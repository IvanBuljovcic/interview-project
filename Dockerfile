# Use Node.js LTS as the base image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Create public directory if it doesn't exist
RUN mkdir -p /app/public

# Build the Next.js application
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to development for dev mode
ENV NODE_ENV=development

# Copy necessary files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/app ./app
COPY --from=builder /app/postcss.config.mjs ./

# Install all dependencies
RUN npm ci

# Create directory for uploaded files and ensure proper permissions
RUN mkdir -p /app/public/uploads && chmod 755 /app/public/uploads

# Expose the port the app will run on
EXPOSE 3000

# Command to run the app
CMD ["npm", "run", "dev"]