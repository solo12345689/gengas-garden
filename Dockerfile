# ---- Server stage ----
FROM node:20-slim AS production

WORKDIR /app

# Copy server files
COPY server ./server

# Copy built client from previous stage
COPY --from=build /app/client/dist ./server/public

# Install Python and server dependencies
RUN apt-get update && apt-get install -y python3 python3-pip
RUN ln -s /usr/bin/python3 /usr/bin/python
WORKDIR /app/server
RUN npm install --omit=dev

EXPOSE 10000
CMD ["node", "index.js"]
