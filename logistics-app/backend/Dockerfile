# Use lightweight Node 20 image as base
FROM node:20-slim

# Install openssl (required by Prisma) and netcat (used in start.sh to check postgres)
# Prisma's query engine depends on OpenSSL.
# Netcat is used in the startup script to wait for the Postgres database to be ready before running migrations and starting the server.
RUN apt-get update -y \
 && apt-get install -y openssl netcat-openbsd \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY shared ./shared

# Copy package files first so Docker caches this layer
# npm install only reruns when package.json changes, not on every code change
COPY backend/package*.json ./backend/

WORKDIR /app/backend

RUN npm install

# Copy prisma schema and generate the client inside the container
# Must happen before copying all source code
COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend .


RUN npx prisma generate

# Compile TypeScript to JavaScript
RUN npm run build

# Copy and permission the startup script
COPY backend/scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

EXPOSE 5000

CMD ["sh", "scripts/start.sh"]