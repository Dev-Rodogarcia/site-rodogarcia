import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { runImprovementRetention } from "./services/improvementService.js";

const app = createApp();
const server = createServer(app);

runImprovementRetention();
setInterval(runImprovementRetention, 24 * 60 * 60 * 1000).unref();

server.listen(env.port, env.host, () => {
  console.log(`Rodogarcia CMS backend running at http://${env.host}:${env.port}`);
});
