# ---------- Stage 1: Build the client ----------
FROM node:18-alpine AS build

WORKDIR /app/client

# Copy and install client dependencies
COPY client/package*.json ./
RUN npm install

# Copy the rest of the client source
COPY client/ .

# Build the React/Vite client
RUN npm run build

# ---------- Stage 2: Build the server ----------
FROM node:18-alpine

WORKDIR /app

# Copy server files
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy the built client from the previous stage
COPY --from=build /app/client/dist ./client/dist
COPY server/ ./server

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose the port
EXPOSE 10000

# Start the server
CMD ["node", "server/server.js"]
