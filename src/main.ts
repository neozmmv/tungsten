import { Context, Hono } from "hono";
import type { RequestBody } from "./interfaces";
import { decodeBase64Url, encodeBase64Url } from "hono/utils/encode";
import { isYoutubeUrl } from "./utils";
import { randomUUID } from 'crypto'
import { unlink, rm } from "fs/promises";

const app = new Hono();

app.get("/:url", async (c: Context) => {
    const url = c.req.param("url") as string
    let decodedUrl;
    try {
        decodedUrl = new TextDecoder().decode(decodeBase64Url(url))
    } catch(err) {
        if(err instanceof DOMException && err.name == "InvalidCharacterError") {
            return c.json({"error": "Invalid URL"}, 400);
        }
        throw err;
    }
    if(!isYoutubeUrl(decodedUrl)) {
        return c.json({"error": "Invalid YouTube URL!"})
    }
    // logic for downloading and serving the video

    const jobDir = `/tmp/${randomUUID()}`;
    await Bun.$`mkdir -p ${jobDir}`;

    const proc = Bun.spawn({
        cmd: [
            "yt-dlp",
            "-f", "bestvideo+bestaudio/best",
            "--merge-output-format", "mp4",
            "-o", `${jobDir}/%(uploader)s - %(title)s.%(ext)s`,
            "--print", "after_move:filepath",
            decodedUrl,
        ],
        stdout: "pipe",
    });

    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
        await rm(jobDir, { recursive: true, force: true });
        return c.json({ error: "yt-dlp failed to download the video" }, 500);
    }
    
    const filepath = stdout.trim();
    const filename = filepath.split("/").pop()!;

    const file = Bun.file(filepath);
    const reader = file.stream().getReader();

    const stream = new ReadableStream({
        async pull(controller) {
            const { done, value } = await reader.read();
            if (done) {
                controller.close();
                await rm(jobDir, { recursive: true, force: true });
                return;
            }
            controller.enqueue(value);
        },
        async cancel() {
            await reader.cancel();
            await rm(jobDir, { recursive: true, force: true });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "video/mp4",
            "Content-Disposition": `attachment; filename="${filename.replace(/"/g, '\\"')}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        },
    });
})

app.post("/", async(c: Context) => {
    // cobalt.tools contract headers
    const accept = c.req.header("Accept");
    const contentType = c.req.header("Content-Type");

    if (accept !== "application/json" || contentType !== "application/json") {
        return c.json(
            {status: "error", error: { code: "error.api.invalid_headers" }}, 400
        );
    }

    const body = await c.req.json<RequestBody>();
    if(!body.url) {
        return c.json({"error": "Must provide YouTube video URL!"}, 400)
    }

    if(!isYoutubeUrl(body.url)) {
        return c.json({"error": "Invalid YouTube link!"})
    }

   const encoded = encodeBase64Url(new TextEncoder().encode(body.url).buffer)
   const url = `${Bun.env.API_URL ?? `http://localhost:${Bun.env.PORT}`}/${encoded}`

   const metaProc = Bun.spawn({
    cmd: [
        "yt-dlp",
        "--print", "filename",
        "-o", "%(uploader)s - %(title)s.%(ext)s",
        "--skip-download",
        body.url,
    ],
        stdout: "pipe",
    });

    const filename = (await new Response(metaProc.stdout).text()).trim();
    const exitCode = await metaProc.exited;

    if (exitCode !== 0) {
        return c.json({ status: "error", error: { code: "error.api.fetch.fail" } }, 500);
    }

   return c.json({
        "status": "tunnel",
        url,
        filename
   })
})

export default {
    port: Bun.env.PORT,
    fetch: app.fetch
}