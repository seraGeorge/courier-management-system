# Use lightweight Node 20 image as base
FROM node:20-slim

# Install openssl (required by Prisma) and netcat (used in start.sh to check postgres)
RUN apt-get update -y && apt-get install -y openssl netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy package files first so Docker caches this layer
# npm install only reruns when package.json changes, not on every code change
COPY package*.json ./
RUN npm install

# Copy prisma schema and generate the client inside the container
# Must happen before copying all source code
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Expose the port the backend runs on
EXPOSE 5000

# Copy and permission the startup script
COPY scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

# Run migrations then start the server
CMD ["sh", "scripts/start.sh"]