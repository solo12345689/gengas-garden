# ---------- Stage 1: Build client ----------
FROM node:22-alpine AS build
WORKDIR /app/client

# Install client dependencies
COPY client/package*.json ./
RUN npm install

# Copy and build client
COPY client/ .
RUN npm run build

# ---------- Stage 2: Server ----------
FROM node:22-alpine AS server
WORKDIR /app

# Install Python (required for youtube-dl-exec)
RUN apk add --no-cache python3 py3-pip

# Copy and install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server

# Skip youtube-dl-exec python check during install
ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1

RUN npm install --omit=dev

# Copy the rest of the server
COPY ./server .

# Copy built client
COPY --from=build /app/client/dist ./public

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]
