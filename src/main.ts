import { Context, Hono } from "hono";

const app = new Hono();

app.get("/", async (c: Context) => {
    return c.json({"msg": "Hello!"})
})

export default {
    port: Bun.env.PORT,
    fetch: app.fetch
}