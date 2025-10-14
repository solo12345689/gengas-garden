# ---- Base stage ----
FROM node:20 AS build

# Set working directory
WORKDIR /app

# Copy client and server code
COPY client ./client
COPY server ./server

# Build client
RUN cd client && npm install && npm run build

# Move client build output to server/public (or similar)
RUN mkdir -p server/public && cp -r client/dist/* server/public/

# ---- Production stage ----
FROM node:20 AS production

WORKDIR /app

# Copy server files
COPY --from=build /app/server ./server

WORKDIR /app/server

# Install only production deps for backend
RUN npm install --omit=dev

EXPOSE 5000

CMD ["npm", "start"]
