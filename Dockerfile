FROM node:20-bullseye-slim
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
RUN pip3 install --upgrade yt-dlp
WORKDIR /usr/src/app
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
# Install server deps and build client
RUN cd client && npm install --omit=dev && npm run build
RUN cd server && npm install --omit=dev
# Copy rest of files
COPY . .
EXPOSE 10000
CMD ["node","server/index.js"]
