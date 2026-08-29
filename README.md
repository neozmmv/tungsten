# Tungsten

Tungsten is a small, self-hosted media downloader focused specifically on YouTube, built as a companion to [Cobalt](https://github.com/imputnet/cobalt). It exists to cover the case where Cobalt's YouTube support tends to break (bot detection, poToken requirements, cookie handling), by delegating the actual extraction and download work to [yt-dlp](https://github.com/yt-dlp/yt-dlp) instead.

The plan is for Tungsten to follow the same API contract as Cobalt (`POST /` with a JSON body, `status`-based JSON responses, a tunnel-style GET endpoint for the actual file), so it can be dropped into any client or frontend already built for Cobalt, including the [cobalt.tools](https://cobalt.tools) web app's self-hosted instance option.

## How it works

1. `POST /` with a JSON body containing the video URL.
2. Tungsten responds with `{ "status": "tunnel", "url": ..., "filename": ... }`, where `url` points to a one-time download link.
3. `GET` that link to stream the video. Once the download finishes, the file is deleted from the server.

## Requirements

- [Docker](https://www.docker.com/) and Docker Compose

## Running it

Pull and start the container:

```bash
docker compose up -d
```

By default, the API is available at `http://localhost:9007`.

Prebuilt images are published to [Docker Hub](https://hub.docker.com/r/neozmmv/tungsten) on every tagged release via GitHub Actions.

## Configuration

Configuration is done through environment variables in `compose.yaml`:

```yaml
services:
  api:
    image: "neozmmv/tungsten:latest"
    ports:
      - "9007:9007"
    environment:
      - PORT=9007
      # uncommenting this changes 'localhost' for the given hostname on url responses
      # - API_URL="http://192.168.0.11"
```

- **`PORT`** — the port the server listens on inside the container. This should match the second number in the `ports` mapping (e.g. `"9007:9007"`).
- **`API_URL`** — the externally reachable URL of your instance. Uncomment and set this if you're exposing Tungsten on your local network or the internet, so the download links returned by the API point to the correct address instead of `localhost`.

## Status

The download flow works end to end and error responses follow Cobalt's `{ "status": "error", "error": { "code": "..." } }` shape.

Still missing for full compatibility with Cobalt clients (e.g. the cobalt.tools web app):

- **CORS** — not yet enabled, so browser-based clients on a different origin can't read the response.
- **HTTPS** — no reverse proxy is set up yet; browsers may block requests to a non-`localhost` HTTP instance from an HTTPS page (mixed content).
- **`GET /` instance info** — not implemented yet.
- **Rate limiting** — not implemented yet.

Only YouTube is supported. There's no plan to support other services Cobalt already covers well.