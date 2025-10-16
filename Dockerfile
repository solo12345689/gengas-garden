# ---------- Base Stage ----------
FROM node:18-alpine AS base
WORKDIR /app

# ---------- Build Client ----------
FROM base AS build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

# ---------- Server Stage ----------
FROM base AS production
WORKDIR /app

# Install Python (for yt-dlp if you use it)
RUN apk add --no-cache python3 py3-pip

# Copy server
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# Copy built client
COPY --from=build /app/client/dist ./public

EXPOSE 10000
CMD ["node", "server.js"]

