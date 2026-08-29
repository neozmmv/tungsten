import { Context, Hono } from "hono";
import type { RequestBody } from "./interfaces";
import { decodeBase64Url, encodeBase64Url } from "hono/utils/encode";
import { isYoutubeUrl, YT_DLP_FORMAT_FLAGS } from "./utils";
import { randomUUID } from 'crypto'
import { unlink, rm } from "fs/promises";
import { cors } from "hono/cors";
import { startTime } from "hono/timing";

const app = new Hono();

app.use("*", cors());

app.get("/", async(c: Context) => {
    return c.json({
        cobalt: {
            "version": "0.1.0",
            "url": Bun.env.API_URL ?? `http://localhost:${Bun.env.PORT}`,
            startTime,
            services: ["youtube"],
        },
        git: {
            "branch": "master",
            "commit": Bun.env.GIT_COMMIT ?? "unknown",
            "remote": "neozmmv/tungsten"
        }
    })
});

app.get("/:url", async (c: Context) => {
    const url = c.req.param("url") as string
    let decodedUrl;
    try {
        decodedUrl = new TextDecoder().decode(decodeBase64Url(url))
    } catch(err) {
        if(err instanceof DOMException && err.name == "InvalidCharacterError") {
            return c.json({ status: "error", error: { code: "error.api.invalid_url" } }, 400);
        }
        throw err;
    }
    if(!isYoutubeUrl(decodedUrl)) {
        return c.json({ status: "error", error: { code: "error.api.not_youtube" } }, 400);
    }
    // logic for downloading and serving the video

    const jobDir = `/tmp/${randomUUID()}`;
    await Bun.$`mkdir -p ${jobDir}`;

    const proc = Bun.spawn({
        cmd: [
            "yt-dlp",
            ...YT_DLP_FORMAT_FLAGS,
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
        return c.json({ status: "error", error: { code: "error.api.download_failed" } }, 500);
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
        return c.json({ status: "error", error: { code: "error.api.missing_url" } }, 400);
    }

    if(!isYoutubeUrl(body.url)) {
        return c.json({ status: "error", error: { code: "error.api.not_youtube" } }, 400);
    }

   const encoded = encodeBase64Url(new TextEncoder().encode(body.url).buffer)
   const url = `${Bun.env.API_URL ?? `http://localhost:${Bun.env.PORT}`}/${encoded}`

   const metaProc = Bun.spawn({
    cmd: [
        "yt-dlp",
        ...YT_DLP_FORMAT_FLAGS,
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