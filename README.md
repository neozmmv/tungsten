# Tungsten

Tungsten is a small, self-hosted media downloader focused specifically on YouTube, built as a companion to [Cobalt](https://github.com/imputnet/cobalt). It exists to cover the case where Cobalt's YouTube support tends to break (bot detection, poToken requirements, cookie handling), by delegating the actual extraction and download work to [yt-dlp](https://github.com/yt-dlp/yt-dlp) instead.

The plan is for Tungsten to follow the same API contract as Cobalt (`POST /` with a JSON body, `status`-based JSON responses, a tunnel-style GET endpoint for the actual file), so it can be dropped into any client or frontend already built for Cobalt, including the [cobalt.tools](https://cobalt.tools) web app's self-hosted instance option.

## How it works

1. `POST /` with a JSON body containing the video URL.
2. Tungsten responds with a `status` field and a `url` pointing to a one-time download link.
3. `GET` that link to stream the video. Once the download finishes, the file is deleted from the server.

## Requirements

- [Docker](https://www.docker.com/) and Docker Compose

## Running it

Clone the repository and start the container:

```bash
docker compose up --build
```

By default, the API is available at `http://localhost:9007`.

## Configuration

Configuration is done through environment variables in `compose.yaml`:

```yaml
services:
  api:
    build:
      dockerfile: Dockerfile
    ports:
      - "9007:9007"
    environment:
      - PORT=9007
      # uncommenting this changes 'localhost' for the given hostname on url responses
      # - API_URL="http://192.168.0.11"
    develop:
      watch:
        - path: "."
          action: rebuild
```

- **`PORT`** — the port the server listens on inside the container. This should match the second number in the `ports` mapping (e.g. `"9007:9007"`).
- **`API_URL`** — the externally reachable URL of your instance. Uncomment and set this if you're exposing Tungsten on your local network or the internet, so the download links returned by the API point to the correct address instead of `localhost`.

The `develop.watch` block enables automatic rebuilds when files change, which is convenient for local development.

## Status

This project is a work in progress. The download flow works end to end, but full compatibility with Cobalt's API contract (error codes, response shapes, CORS, HTTPS) is still being built out.