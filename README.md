# Tungsten

Tungsten is a small, self-hosted media downloader focused specifically on YouTube, built as a companion to [Cobalt](https://github.com/imputnet/cobalt). It exists to cover the case where Cobalt's YouTube support tends to break (bot detection, poToken requirements, cookie handling), by delegating the actual extraction and download work to [yt-dlp](https://github.com/yt-dlp/yt-dlp) instead.

Tungsten follows Cobalt's API contract (`POST /` with a JSON body, `status`-based JSON responses, a tunnel-style GET endpoint for the actual file), so it can be dropped into any client or frontend already built for Cobalt, including the [cobalt.tools](https://cobalt.tools) web app's self-hosted instance option — it's been tested working with it directly.

## How it works

1. `POST /` with a JSON body containing the video URL.
2. Tungsten responds with `{ "status": "tunnel", "url": ..., "filename": ... }`, where `url` points to a one-time download link.
3. `GET` that link to stream the video. Once the download finishes, the file is deleted from the server.

A standalone Python download script is included in the repository for people who'd rather use the API directly instead of the cobalt.tools frontend.

```bash
# example
python download.py https://www.youtube.com/watch?v=BSTsnWoslP4
```

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
      # - API_URL=http://192.168.0.11:9007
```

- **`PORT`** — the port the server listens on inside the container. This should match the second number in the `ports` mapping (e.g. `"9007:9007"`).
- **`API_URL`** — the externally reachable URL of your instance, port included. Uncomment and set this if you're exposing Tungsten on your local network or the internet, so the download links returned by the API point to the correct address instead of `localhost`.

## Status

The download flow works end to end, and it interoperates with the cobalt.tools frontend when set as a self-hosted API instance. Error responses follow Cobalt's `{ "status": "error", "error": { "code": "..." } }` shape, required headers are validated on `POST /`, and `GET /` returns basic instance info in the same shape as a real Cobalt instance.

Known limitations:

- **No download progress until the file is ready.** Tungsten downloads and remuxes the video fully on the server before it starts streaming the response, so clients see no progress feedback until that's done. A real Cobalt tunnel pipes bytes as they're fetched from the source; matching that would require streaming yt-dlp's output directly, which conflicts with merging separate video/audio streams into an MP4.
- **HTTPS** — no reverse proxy is set up yet; browsers may block requests to a non-`localhost` HTTP instance from an HTTPS page (mixed content).
- **Rate limiting** — not implemented yet.

Only YouTube is supported. There's no plan to support other services Cobalt already covers well.