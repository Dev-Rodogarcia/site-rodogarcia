const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("./site/backend/node_modules/dotenv");

const rootDir = __dirname;
const envFile = process.env.RODOGARCIA_ENV_FILE
  ? path.resolve(rootDir, process.env.RODOGARCIA_ENV_FILE)
  : path.join(rootDir, ".env.production.local");

if (!fs.existsSync(envFile)) {
  throw new Error(
    `Arquivo de ambiente de produção não encontrado: ${envFile}. Configure RODOGARCIA_ENV_FILE ou crie .env.production.local.`
  );
}

const productionEnv = dotenv.parse(fs.readFileSync(envFile));
const sharedEnv = {
  ...productionEnv,
  NODE_ENV: "production",
  BACKEND_INTERNAL_URL: "http://127.0.0.1:41050",
  CMS_BACKEND_INTERNAL_URL: "http://127.0.0.1:41051",
  CMS_INTERNAL_URL: "http://127.0.0.1:41061",
  CMS_BACKEND_PROXY_URL: "http://127.0.0.1:41051",
  LANDING_BUILDER_API_URL: "http://127.0.0.1:41110",
  LANDING_BUILDER_PUBLIC_URL: "http://127.0.0.1:41112",
  LANDING_BUILDER_ASSET_PREFIX:
    productionEnv.LANDING_BUILDER_ASSET_PREFIX || "/landing-assets",
  NEXT_PUBLIC_SITE_URL:
    productionEnv.NEXT_PUBLIC_SITE_URL || "https://site.rodogarcia.com.br",
};

const backendEnv = {
  ...sharedEnv,
  HOST: "127.0.0.1",
  PORT: "41050",
};

const frontendEnv = {
  ...sharedEnv,
  HOSTNAME: "127.0.0.1",
  PORT: "41060",
};

const cmsBackendEnv = {
  ...sharedEnv,
  HOST: "127.0.0.1",
  PORT: "41051",
};

const cmsEnv = {
  ...sharedEnv,
  HOSTNAME: "127.0.0.1",
  PORT: "41061",
};

const landingBuilderBackendEnv = {
  ...sharedEnv,
  HOST: "127.0.0.1",
  PORT: "41110",
  LANDING_BUILDER_HOST: "127.0.0.1",
  LANDING_BUILDER_PORT: "41110",
};

const landingBuilderEnv = {
  ...sharedEnv,
  HOSTNAME: "127.0.0.1",
  PORT: "41112",
  LANDING_BUILDER_BACKEND_URL: "http://127.0.0.1:41110",
  LANDING_BUILDER_SITE_URL:
    productionEnv.NEXT_PUBLIC_SITE_URL || "https://site.rodogarcia.com.br",
};

const cmsBackendScript = path.join(rootDir, "cms", "backend", "dist", "server.js");
const hasCmsBackendArtifact = fs.existsSync(cmsBackendScript);
const landingBuilderBackendScript = path.join(rootDir, "landing-builder", "backend", "dist", "server.js");
const landingBuilderFrontendScript = path.join(rootDir, "landing-builder", "frontend", "dist-prod", "server.js");
const hasLandingBuilderBackendArtifact = fs.existsSync(landingBuilderBackendScript);
const hasLandingBuilderFrontendArtifact = fs.existsSync(landingBuilderFrontendScript);

module.exports = {
  apps: [
    {
      name: "rodogarcia-backend-prod",
      cwd: path.join(rootDir, "site", "backend"),
      script: "dist/server.js",
      interpreter: "node",
      // `env` permite `pm2 restart ecosystem.config.js` sem depender de --env.
      env: backendEnv,
      env_production: backendEnv,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      kill_timeout: 5000,
      time: true,
      out_file: path.join(rootDir, "logs", "rodogarcia-backend-out.log"),
      error_file: path.join(rootDir, "logs", "rodogarcia-backend-error.log"),
    },
    {
      name: "rodogarcia-frontend-prod",
      cwd: path.join(rootDir, "site", "frontend", "dist-prod"),
      script: "server.js",
      interpreter: "node",
      env: frontendEnv,
      env_production: frontendEnv,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      kill_timeout: 5000,
      time: true,
      out_file: path.join(rootDir, "logs", "rodogarcia-frontend-out.log"),
      error_file: path.join(rootDir, "logs", "rodogarcia-frontend-error.log"),
    },
    ...(hasCmsBackendArtifact ? [{
      name: "rodogarcia-cms-backend-prod",
      cwd: path.join(rootDir, "cms", "backend"),
      script: "dist/server.js",
      interpreter: "node",
      env: cmsBackendEnv,
      env_production: cmsBackendEnv,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      kill_timeout: 5000,
      time: true,
      out_file: path.join(rootDir, "logs", "rodogarcia-cms-backend-out.log"),
      error_file: path.join(rootDir, "logs", "rodogarcia-cms-backend-error.log"),
    }] : []),
    {
      name: "rodogarcia-cms-prod",
      cwd: path.join(rootDir, "cms", "frontend", "dist-prod"),
      script: "server.js",
      interpreter: "node",
      env: cmsEnv,
      env_production: cmsEnv,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      kill_timeout: 5000,
      time: true,
      out_file: path.join(rootDir, "logs", "rodogarcia-cms-out.log"),
      error_file: path.join(rootDir, "logs", "rodogarcia-cms-error.log"),
    },
    ...(hasLandingBuilderBackendArtifact ? [{
      name: "rodogarcia-landing-builder-backend-prod",
      cwd: path.join(rootDir, "landing-builder", "backend"),
      script: "dist/server.js",
      interpreter: "node",
      env: landingBuilderBackendEnv,
      env_production: landingBuilderBackendEnv,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      kill_timeout: 5000,
      time: true,
      out_file: path.join(rootDir, "logs", "rodogarcia-landing-builder-backend-out.log"),
      error_file: path.join(rootDir, "logs", "rodogarcia-landing-builder-backend-error.log"),
    }] : []),
    ...(hasLandingBuilderFrontendArtifact ? [{
      name: "rodogarcia-landing-builder-prod",
      cwd: path.join(rootDir, "landing-builder", "frontend", "dist-prod"),
      script: "server.js",
      interpreter: "node",
      env: landingBuilderEnv,
      env_production: landingBuilderEnv,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      kill_timeout: 5000,
      time: true,
      out_file: path.join(rootDir, "logs", "rodogarcia-landing-builder-out.log"),
      error_file: path.join(rootDir, "logs", "rodogarcia-landing-builder-error.log"),
    }] : []),
  ],
};
