import { Context, Hono } from "hono";
import type { RequestBody } from "./interfaces";
import { decodeBase64Url, encodeBase64Url } from "hono/utils/encode";

const app = new Hono();

app.get("/", async (c: Context) => {
    return c.json({"msg": "Hello!"})
})

app.post("/", async(c: Context) => {
    const body = await c.req.json<RequestBody>();
    if(!body.url) {
        return c.json({"error": "Must provide YouTube video URL!"}, 400)
    }

   const encoded = encodeBase64Url(new TextEncoder().encode(body.url).buffer)
   const decoded = decodeBase64Url(encoded)
   const decodedString = new TextDecoder().decode(decoded)

   return c.json({
    encoded, decodedString
   })
})

export default {
    port: Bun.env.PORT,
    fetch: app.fetch
}