# CODEX.md

The canonical project guide lives in `docs/ai/project-guide.md`. Read it before editing this repository.

Critical reminders:

- The active app is `Next.js 16` with `React 19` and `TypeScript`.
- Do not reintroduce legacy `server.js`, `vercel.json`, `robots.txt`, `sitemap.xml`, `src/*.html`, `src/css/**`, `src/js/**`, or `src/developer/**` without explicit request.
- Check routes in `src/lib/routes.ts`, persistence in `src/lib/storagePaths.ts`, and auth guard behavior in `src/proxy.ts`.
- For new public-facing sections, use `.codex/skills/rodogarcia-ui-sections/SKILL.md`.
- Treat generated and local runtime artifacts as non-source; rely on `.gitignore` for repo-wide ignore patterns.
