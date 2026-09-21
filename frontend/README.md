# LoanPilot — Frontend

The React 19 + TypeScript + Vite SPA for LoanPilot. Renders only results computed by the backend
FastAPI engine — no loan math in the browser.

Documentation covering the whole project (backend, env vars, share links, design) now lives in the
**root [`../README.md`](../README.md)**.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + Vite build → dist/
npm run test       # vitest
npm run lint       # oxlint
```

Key env vars (see `src/config.ts`): `VITE_API_BASE_URL` (default `http://localhost:8000`) and
`VITE_PUBLIC_URL` (default `window.location.origin`; set at build time for deployed share links).

## Stack

- React 19, TypeScript, Vite (rolldown), React Router, Tailwind CSS 3, oxlint.
- shadcn-style primitives in `src/components/ui/*` (built native, no runtime UI library).
- Exact designs served from `../design_references/` (desktop + mobile HTML).
