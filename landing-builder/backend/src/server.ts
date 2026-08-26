import "dotenv/config";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

createApp().listen(env.port, env.host, () => console.log(`Landing Builder API em http://${env.host}:${env.port}`));
