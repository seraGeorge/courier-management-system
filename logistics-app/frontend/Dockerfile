# Use lightweight Node 20 image as base
FROM node:20-slim

# Set working directory
WORKDIR /app/frontend

# Copy package files first so Docker can cache dependencies
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy shared package
COPY shared ../shared

# Copy application source
COPY frontend ./

# Build-time environment variable for Next.js
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_STAFF_API_KEY
ENV NEXT_PUBLIC_STAFF_API_KEY=$NEXT_PUBLIC_STAFF_API_KEY

ARG NEXT_PUBLIC_STAFF_SECRET_KEY
ENV NEXT_PUBLIC_STAFF_SECRET_KEY=$NEXT_PUBLIC_STAFF_SECRET_KEY

# Build the application
RUN npm run build

# Expose Next.js port
EXPOSE 3000

# Start the production server
CMD ["npm", "start"]