# ---- Base build ----
FROM node:20-slim AS build

WORKDIR /app

# Copy client files
COPY client ./client

# Build client
RUN cd client && npm install && npm run build

# ---- Server stage ----
FROM node:20-slim AS production

WORKDIR /app

# Copy server files
COPY server ./server

# Copy built client from previous stage
COPY --from=build /app/client/dist ./server/public

# Install server dependencies and Python for yt-dlp
RUN apt-get update && apt-get install -y python3 python3-pip && \
    cd server && npm install --omit=dev

EXPOSE 10000
CMD ["node", "server/index.js"]


