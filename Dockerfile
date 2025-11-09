# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

LABEL maintainer="MHProDev"
LABEL description="MHDDoS Node.js - Advanced DDoS Testing Tool"

WORKDIR /app

# Install build dependencies for native modules (if needed)
RUN apk add --no-cache python3 make g++ git

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy all application code
COPY . .

# Make index.js executable
RUN chmod +x index.js

# Create necessary directories
RUN mkdir -p files/proxies

# Expose port for potential web interface (future feature)
EXPOSE 3000

# Health check (optional)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Default command - show methods
ENTRYPOINT ["node", "index.js"]
CMD ["methods"]
