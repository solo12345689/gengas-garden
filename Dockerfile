# ---------- Stage 1: Build client ----------
FROM node:22-alpine AS build
WORKDIR /app/client

# Copy and install client dependencies
COPY client/package*.json ./
RUN npm install

# Copy the rest of the client files and build
COPY client/ .
RUN npm run build

# ---------- Stage 2: Server ----------
FROM node:22-alpine AS server
WORKDIR /app

# Copy server package files and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy server source
COPY server ./server

# Copy built client from previous stage
COPY --from=build /app/client/dist ./server/public

# Expose port
EXPOSE 5000

# Run the server
CMD ["node", "server/index.js"]
