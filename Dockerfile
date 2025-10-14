# ---- Build client ----
FROM node:18 AS build
WORKDIR /app

# Copy and install client
COPY client/package*.json ./client/
RUN cd client && npm install && npm run build

# ---- Server stage ----
FROM node:18
WORKDIR /app

# Install Python for yt-dlp
RUN apt-get update && apt-get install -y python3 python3-pip

# Copy server files
COPY server ./server

# Copy built client
COPY --from=build /app/client/dist ./client/dist

WORKDIR /app/server
RUN npm install --omit=dev

EXPOSE 10000
CMD ["node", "index.js"]

