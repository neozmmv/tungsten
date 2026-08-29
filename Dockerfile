FROM oven/bun:alpine

RUN apk add --no-cache python3 py3-pip ffmpeg && \
    pip install --break-system-packages --no-cache-dir yt-dlp && \
    rm -rf /root/.cache /var/cache/apk/*

ARG VERSION=unknown
ARG GIT_COMMIT=unknown
ENV VERSION=$VERSION
ENV GIT_COMMIT=$GIT_COMMIT

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY src ./src

CMD ["bun", "run", "src/main.ts"]