# Use lightweight Node 20 image as base
FROM node:20-slim

# Set working directory inside the container
WORKDIR /app

# Copy package files first so Docker caches this layer
# npm install only reruns when package.json changes, not on every code change
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Accept the API URL as a build argument
# Next.js NEXT_PUBLIC_* variables must be available at build time, not just runtime
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_STAFF_API_KEY
ENV NEXT_PUBLIC_STAFF_API_KEY=$NEXT_PUBLIC_STAFF_API_KEY

ARG NEXT_PUBLIC_STAFF_SECRET_KEY
ENV NEXT_PUBLIC_STAFF_SECRET_KEY=$NEXT_PUBLIC_STAFF_SECRET_KEY

# Build the Next.js app
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "start"]