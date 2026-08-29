FROM oven/bun:alpine

COPY package.json ./
COPY bun.lock ./
COPY src ./

RUN bun install
CMD ["bun", "run", "main.ts"]