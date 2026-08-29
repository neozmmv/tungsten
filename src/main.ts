import { Context, Hono } from "hono";
import type { RequestBody } from "./interfaces";
import { decodeBase64Url, encodeBase64Url } from "hono/utils/encode";

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
    return c.json({decodedUrl})
})

app.post("/", async(c: Context) => {
    const body = await c.req.json<RequestBody>();
    if(!body.url) {
        return c.json({"error": "Must provide YouTube video URL!"}, 400)
    }

   const encoded = encodeBase64Url(new TextEncoder().encode(body.url).buffer)
   const url = `${Bun.env.API_URL ?? `http://localhost:${Bun.env.PORT}`}/${encoded}`

   return c.json(url)
})

export default {
    port: Bun.env.PORT,
    fetch: app.fetch
}