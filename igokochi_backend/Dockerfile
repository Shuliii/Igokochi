# Use an LTS Node image (smaller + stable)
FROM node:20-alpine

WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# For security: run as non-root user provided by node image
USER node

# Your app listens on PORT (default 4000)
EXPOSE 4000

# Start server
CMD ["npm", "start"]
