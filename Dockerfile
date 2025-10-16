# ---------- Build client ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client ./client
RUN cd client && npm run build

# ---------- Production server ----------
FROM node:20-alpine
WORKDIR /app

# Install Python (for yt-dlp)
RUN apk add --no-cache python3 py3-pip

# Copy built client and server
COPY --from=build /app/client/dist ./server/public
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev
COPY server ./server

EXPOSE 10000
CMD ["node", "server/index.js"]
