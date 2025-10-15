# ---------- Build stage ----------
FROM node:18 AS build
WORKDIR /app

# Copy and build client
COPY client ./client
RUN cd client && npm install && npm run build

# ---------- Production stage ----------
FROM node:18-slim
WORKDIR /app

# Install Python + link python3 -> python
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy server and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy server source + built client
COPY server ./server
COPY --from=build /app/client/dist ./server/public

WORKDIR /app/server
EXPOSE 10000

# ✅ Correct entry file
CMD ["node", "index.js"]
