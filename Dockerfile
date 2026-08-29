FROM oven/bun:alpine

RUN apk add --no-cache python3 py3-pip ffmpeg
RUN pip install --break-system-packages --no-cache-dir yt-dlp

ARG VERSION=unknown
ARG GIT_COMMIT=unknown
ENV VERSION=$VERSION
ENV GIT_COMMIT=$GIT_COMMIT

WORKDIR /app

COPY package.json ./
COPY bun.lock ./
COPY src ./src

RUN bun install

CMD ["bun", "run", "src/main.ts"]