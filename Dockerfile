# ---------- Base build stage ----------
FROM node:18 AS build

WORKDIR /app

# Build frontend
COPY client/package*.json ./client/
RUN cd client && npm install && npm run build

# ---------- Production stage ----------
FROM node:18

WORKDIR /app

# Install Python for yt-dlp
RUN apt-get update && apt-get install -y python3 python3-pip

# Copy built frontend
COPY --from=build /app/client/dist ./server/public

# Copy backend
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

COPY server ./server

EXPOSE 10000
WORKDIR /app/server

CMD ["npm", "start"]
