FROM oven/bun:alpine

RUN apk add --no-cache python3 py3-pip ffmpeg
RUN pip install --break-system-packages --no-cache-dir yt-dlp


COPY package.json ./
COPY bun.lock ./
COPY src ./

RUN bun install
CMD ["bun", "run", "main.ts"]