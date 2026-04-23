# AI Project Guide

## Objective

Use this guide as the canonical map for AI agents working in this repository. It reflects the current Next.js application and should take precedence over historical documentation when there is any conflict.

## Source Of Truth

- The active project is a `Next.js 16` app with `React 19` and `TypeScript`.
- The current source of truth is `package.json`, `next.config.ts`, `tsconfig.json`, `src/app/**`, `src/components/**`, `src/lib/**`, `src/hooks/**`, and `src/types/**`.
- `server/storage/**` is part of the runtime; App Router handlers read and write JSON there.
- `README.md`, `server/README.md`, `docs/checklist-tecnico.md`, `scripts/README.md`, and `.env.example` still contain mixed legacy references. Read them as historical context, not as authoritative instructions.

## Current State

- The repository is in the middle of a large migration from the old static site (`HTML/CSS/JS + server.js`) to the current Next app.
- Do not reintroduce legacy targets unless the task explicitly asks for that. In particular, avoid recreating or moving logic back to:
  - `server.js`
  - `vercel.json`
  - `robots.txt`
  - `sitemap.xml`
  - `src/*.html`
  - `src/css/**`
  - `src/js/**`
  - `src/developer/**`
- Technical SEO now lives in `src/app/robots.ts` and `src/app/sitemap.ts`.
- Old route redirects are handled through `next.config.ts` and `src/lib/routes.ts`.

## Project Map

- `src/app/`
  - public pages
  - auth routes
  - `/developer` panel
  - `/api` route handlers
- `src/components/`
  - layout components
  - public page components
  - admin panel components
  - base UI
- `src/lib/`
  - central routes
  - sanitization
  - session and auth
  - JSON persistence
  - rate limiting
  - API helpers
- `src/hooks/`
  - shared hooks
- `src/types/`
  - shared types
- `public/`
  - real public assets
- `server/storage/`
  - editable content and form data
- `server/storage/private/`
  - sensitive users, sessions, analytics, and rate limits

## Sensitive áreas

- Never expose or publish `server/storage/private/**`.
- Do not edit `.env` or credentials without a direct task requirement.
- Do not treat `.next/`, `node_modules/`, `test-results/`, `backups/`, or `tmp-*` files as source code.
- If the change touches auth, forms, popup flows, analytics, or admin CRUD, preserve validation, sanitization, CSRF, and rate limits.

## Persistence

Persistence paths are centralized in `src/lib/storagePaths.ts`.

- `server/storage/content.json`
  - `heroSlides`
  - `dnaSlides`
  - `vagas`
  - `feedbacks`
- `server/storage/site-texts.json`
  - editable site copy
- `server/storage/contacts.json`
  - contact leads
- `server/storage/quotes.json`
  - quote requests
- `server/storage/popup-config.json`
  - popup configuration
- `server/storage/popup-leads.json`
  - popup leads
- `server/storage/popup-events.json`
  - popup events
- `server/storage/private/users.json`
  - admin users
- `server/storage/private/sessions.json`
  - authenticated sessions
- `server/storage/private/analytics.json`
  - analytics sessions and events
- `server/storage/private/analytics-config.json`
  - analytics configuration
- `server/storage/private/rate-limits.json`
  - local rate limit data

## Routes And Conventions

- The route map lives in `src/lib/routes.ts`.
- Before hardcoding any URL, check whether a constant already exists there.
- Legacy URL sanitization lives in `src/lib/sanitize.ts`.
- `sanitizeUrl()` and `sanitizePath()` map old `*.html` paths to the current routes.
- In React and Next code, prefer public assets as `/logo.png`, never `/public/logo.png`.

## Auth And Admin

- The panel access guard lives in `src/proxy.ts`.
- The main cookie is `sid`.
- Sessions live in `src/lib/session.ts`.
- Users live in `src/lib/users.ts`.
- Auth routes live in `src/app/auth/**` and `src/app/api/auth/**`.
- Admin endpoints live under `/developer` and `/api/admin/**`.

Core admin files:

- `src/app/developer/layout.tsx`
- `src/app/developer/page.tsx`
- `src/components/developer/DevSidebar.tsx`
- `src/components/developer/EntityManager.tsx`
- `src/app/api/admin/[...slug]/route.ts`
- `src/lib/content.ts`

Current admin entities:

- `hero`
- `dna`
- `vagas`
- `feedbacks`
- `site-texts`

If a task touches those entities, preserve JSON shape, `order`, sanitization, panel compatibility, and `preparePublicContent()` compatibility.

## Forms, Popup, And Analytics

- Contact: `src/app/api/contact/route.ts`
- Quote: `src/app/api/quote/route.ts`
- Popup leads: `src/app/api/leads/route.ts`
- Popup config: `src/app/api/popup-config/route.ts`
- Popup events: `src/app/api/popup-events/route.ts`
- Analytics: `src/app/api/analytics/**`

These endpoints persist local JSON and enforce validation and rate limiting. If you edit them, confirm that the stored shape remains compatible with both the frontend and the admin panel.

## Where To Edit

- Global visual and layout work
  - `src/app/layout.tsx`
  - `src/app/globals.css`
  - `src/components/layout/**`
- Public pages
  - `src/app/<route>/page.tsx`
  - corresponding components in `src/components/**`
- Home
  - `src/app/page.tsx`
  - `src/components/home/**`
  - dynamic content in `server/storage/content.json`
- Shared routes, navigation, and SEO
  - `src/lib/routes.ts`
  - `src/app/robots.ts`
  - `src/app/sitemap.ts`
- Auth
  - `src/app/auth/**`
  - `src/app/api/auth/**`
  - `src/lib/session.ts`
  - `src/lib/users.ts`
  - `src/proxy.ts`
- Editable content
  - `src/lib/content.ts`
  - `src/app/api/admin/[...slug]/route.ts`
  - `src/app/developer/**`
  - `src/components/developer/**`
- Persisted data
  - `server/storage/**`

## Practical Rules

- Before editing a public route, check `src/lib/routes.ts`.
- Before changing persisted data, check `src/lib/storagePaths.ts` and the corresponding route handler.
- Before changing panel auth, check `src/proxy.ts`, `src/lib/session.ts`, and `src/app/api/auth/**`.
- Before editing CMS-like text, confirm whether it comes from `server/storage/content.json` or `server/storage/site-texts.json` rather than from a hardcoded component.
- Before changing links stored in JSON, remember that the project still preserves compatibility with old `.html` URLs.
- Do not remove sanitization just to accept broader input. The project relies on that layer for legacy data compatibility.
- Prefer absolute imports with `@/`.
- Preserve strict TypeScript.
- If you add a new persisted file, centralize its path in `src/lib/storagePaths.ts`.

## Public UI Work

- For new or refactored public-facing sections, use `.codex/skills/rodogarcia-ui-sections/SKILL.md`.
- That skill codifies the visual guardrails for this project: avoid cardception, separate sections through surface and spacing, vary compositions across the page, and keep the same level of refinement as the Home.
- Before drawing a new section, also review `.codex/skills/rodogarcia-ui-sections/references/home-language.md` and `src/components/home/**`.

## Ignore Strategy

- Repo-wide local artifact patterns are consolidated in `.gitignore`.
- Claude-specific file denial now lives in `.claude/settings.json`.
- Do not depend on generated build output, local backups, or sensitive runtime JSON unless the task explicitly requires them.

## Useful Commands

- Development: `npm run dev`
- Verification build: `npm run build`
- Local production: `npm run start`

## Operating Order

When there is doubt about where to edit, use this order:

1. `package.json`, `next.config.ts`, `tsconfig.json`
2. `src/lib/routes.ts` and `src/lib/storagePaths.ts`
3. `src/app/**` and `src/components/**`
4. `server/storage/**`
5. legacy documentation only as historical context
