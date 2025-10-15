# ---- Build client ----
FROM node:20-slim AS build

WORKDIR /app/client

# Copy client package files and install deps
COPY client/package*.json ./
RUN npm install

# Copy rest of the client code
COPY client/ ./

# Build client
RUN npm run build

# ---- Server stage ----
FROM node:20-slim AS production

WORKDIR /app

# Copy server code
COPY server ./server

# Copy built client from build stage
COPY --from=build /app/client/dist ./server/public

# Install Python (for yt-dlp) and server dependencies
RUN apt-get update && apt-get install -y python3 python3-pip
RUN ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app/server
RUN npm install --omit=dev

EXPOSE 10000
CMD ["node", "index.js"]
