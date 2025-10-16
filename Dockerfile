# ---------- Base Node Image ----------
FROM node:18-alpine AS base
WORKDIR /app

# ---------- Build Client ----------
FROM base AS build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

# ---------- Production Server ----------
FROM base AS production
WORKDIR /app

# Install Python (for yt-dlp if needed)
RUN apk add --no-cache python3 py3-pip

# Copy server dependencies and install them
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# Copy the server source code
COPY server ./ 

# Copy the built frontend into server/public
COPY --from=build /app/client/dist ./public

# Expose the server port
EXPOSE 10000

# Run the backend
CMD ["node", "index.js"]
