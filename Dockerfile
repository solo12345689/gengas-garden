FROM node:20-bullseye-slim
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
RUN pip3 install --upgrade yt-dlp
WORKDIR /usr/src/app
COPY . .
RUN cd client && npm ci --omit=dev
RUN cd server && npm ci --omit=dev
RUN cd client && npm run build
EXPOSE 8080
CMD ["node","server/index.js"]
