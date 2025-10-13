FROM node:20
WORKDIR /app

# Copy only package.json (skip lockfiles)
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install deps
RUN cd client && npm install --omit=dev && npm run build
RUN cd server && npm install --omit=dev

COPY . .

ENV PORT=10000
EXPOSE 10000

CMD ["node", "server/index.js"]
