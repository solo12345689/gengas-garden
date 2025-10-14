# ---- Base stage ----
FROM node:20 AS build

# Install Python (needed for yt-dlp)
RUN apt-get update && apt-get install -y python3 && ln -s /usr/bin/python3 /usr/bin/python

# Set working directory
WORKDIR /app

# Copy client and server
COPY client ./client
COPY server ./server

# Build the client (React/Vite)
RUN cd client && npm install && npm run build

# Move client build output to server/public
RUN mkdir -p server/public && cp -r client/dist/* server/public/

# ---- Production stage ----
FROM node:20 AS production

# Install Python again for yt-dlp
RUN apt-get update && apt-get install -y python3 && ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Copy server from build
COPY --from=build /app/server ./server

WORKDIR /app/server

# Install only production deps
RUN npm install --omit=dev

EXPOSE 5000

CMD ["npm", "start"]
