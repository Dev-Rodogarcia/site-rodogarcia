import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();
const server = createServer(app);

server.listen(env.port, env.host, () => {
  console.log(`Rodogarcia backend running at http://${env.host}:${env.port}`);
});
