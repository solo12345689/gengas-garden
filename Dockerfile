# Use official Node image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package manifests first (for caching)
COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/

# Install dependencies and build client
RUN cd client && npm install --omit=dev && npm run build

# Install backend dependencies
RUN cd server && npm install --omit=dev

# Copy all remaining project files
COPY . .

# Expose port (Render expects dynamic port)
ENV PORT=10000
EXPOSE 10000

# Start both frontend (static) and backend
CMD ["node", "server/index.js"]
