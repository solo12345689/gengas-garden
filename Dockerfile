# ---------- Stage 1: Build the React client ----------
FROM node:18-alpine AS build

WORKDIR /app/client

# Copy and install client dependencies
COPY client/package*.json ./
RUN npm install

# Copy the rest of the client code
COPY client/ .

# Build the client
RUN npm run build

# ---------- Stage 2: Build the server ----------
FROM node:18-alpine

WORKDIR /app

# Copy server dependencies and install
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy server code
COPY server/ ./server

# Copy built client files from previous stage
COPY --from=build /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

CMD ["node", "server/server.js"]
