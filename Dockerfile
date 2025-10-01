# Multi-stage build for React frontend
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --only=production --silent

# Copy source code (excluding unnecessary files)
COPY public/ ./public/
COPY src/ ./src/
COPY tsconfig.json ./

# Build the application with optimizations
RUN npm run build

# Production stage with serve (lightweight HTTP server)
FROM node:18-alpine

# Install serve globally for serving static files
RUN npm install -g serve

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy built assets from build stage
COPY --from=build /app/build ./build

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh

# Make entrypoint executable and set proper permissions
RUN chmod +x /app/entrypoint.sh && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check optimized for Dockploy
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Labels for better container management
LABEL maintainer="SST Platform Team" \
      version="1.0" \
      description="SST Platform Frontend - React Application"

# Use entrypoint script to generate runtime config and start serve
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["serve", "-s", "build", "-l", "3000", "--silent"]