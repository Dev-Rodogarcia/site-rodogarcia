import "dotenv/config";
import { createApp } from "./app.js";

const host = process.env.LANDING_BUILDER_HOST ?? process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.LANDING_BUILDER_PORT ?? process.env.PORT ?? 6110);
createApp().listen(port, host, () => console.log(`Landing Builder API em http://${host}:${port}`));
