# Phase 1 — App and containers (local)
Dev work: `api/` (Express + pg) with `/healthz`, `/api/health`, `/api/subscribe`, `/api/contact`; schema auto-migrated on start.
Web: Vite site served by Nginx (`web/Dockerfile`), proxies `/api/` to `API_UPSTREAM`.
Local orchestration: `docker-compose.yml` (web, api, postgres).
**DoD:** `npm test` (root + api) green; `docker compose up --build` serves site on :8080; subscribing stores a row.
