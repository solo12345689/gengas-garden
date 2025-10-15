# ---------- Build stage ----------
FROM node:18 AS build
WORKDIR /app

# Copy and build client
COPY client/package*.json ./client/
RUN cd client && npm install && npm run build

# ---------- Production stage ----------
FROM node:18-slim

WORKDIR /app

# Copy server files
COPY server/package*.json ./server/
RUN apt-get update && apt-get install -y python3 python3-pip && \
    cd server && npm install --omit=dev

# Copy server source code
COPY server ./server

# Copy built client into public directory
COPY --from=build /app/client/dist ./server/public

WORKDIR /app/server
EXPOSE 10000

CMD ["node", "server.js"]
