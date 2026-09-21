# LoanPilot — Loan Payoff Planner

An honest loan-payoff calculator. Model your current EMI, try a "pay extra / shorten term /
target-payoff" strategy, and see — before you commit a rupee — how much interest and time you
save materially. The React app renders only results computed by the FastAPI engine; **no loan
math runs in the browser**, so the numbers you share are the numbers the backend produced.

## Why it exists

Bank calculators, spreadsheets, and Google only show EMIs — not "what happens if I pay ₹5,000
extra every month", "which of my loans to clear first", or "is it better to invest than prepay".
LoanPilot answers exactly those questions with a single runnable plan and a shareable summary.

Full product thinking (problem, target user, alternatives, MVP inputs) lives in
[`PRODUCT.md`](PRODUCT.md).

## Repository layout

```
├── PRODUCT.md        product spec (problem / target / MVP / alternatives)
├── design_references/ approved desktop + mobile designs (HTML)
├── backend/          FastAPI service — the ONLY place loan math runs
│   ├── app/
│   │   ├── main.py           FastAPI app + POST /api/v1/loan/plan
│   │   ├── schemas.py        request/response models
│   │   └── engine/
│   │       └── amortization.py  amortization + payoff strategy math
│   └── tests/                pytest: amortization + API end-to-end
└── frontend/         React 19 + TypeScript + Vite SPA
    └── src/
        ├── pages/            Calculator, results, assumptions, legal
        ├── components/       metric cards, interest chart, share actions…
        └── utils/            share-text builders, formatting, chart series
```

## Backend (FastAPI + uvicorn)

Pure-Python computation service with pinned deps (`backend/requirements.txt`). No database —
loan plans are computed on request and never persisted.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000     # API on http://localhost:8000
```

- API: `POST /api/v1/loan/plan` — send loan inputs + optional strategy, get the baseline and
  new-plan comparison (instalment, total paid, interest, payoff duration, interest/time saved).
- Runs the real engine: `app/engine/amortization.py`.
- Tests: `pytest` (CORS-origin coverage + amortization correctness + API round-trip).

### Environment

- `FRONTEND_ORIGINS` — comma-separated allowed origins for CORS. Defaults to the Vite dev
  (`http://localhost:5173`) and preview origins.
- Set it in production to the deployed frontend origin, or the browser will block requests.

## Frontend (React + Vite + TypeScript)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc type-check + Vite production build → dist/
npm run preview    # serve the production build (SPA fallback included)
npm run test       # vitest
npm run lint       # oxlint
```

### Environment

- `VITE_API_BASE_URL` — backend URL. Default `http://localhost:8000` (see `src/config.ts`).
- `VITE_PUBLIC_URL` — public origin used in WhatsApp share messages, metas, `robots.txt` /
  `sitemap.xml`. Defaults to the current `window.location.origin`; **set it at build time for
  deployed share links** (Vite hardcodes `import.meta.env` values into `dist/`).
- Node: builds pass on **22.11**; Vite 8 targets a newer Node — upgrade when convenient.

### Tests & lint

- Unit tests: formatting (`utils/format`), chart series, share-text builders, and the lump-sum
  editor. Component tests under `src/`.
- `oxlint`: 0 errors. One known warning remains (`button.tsx` fast-refresh export); it's
  deliberate and tracked.

## Share & the public URL

Two distinct WhatsApp actions (in `ShareActions.tsx` + `utils/share.ts`):

- **Share results** — a formatted summary: current vs. new plan (instalment, amount paid,
  interest, payoff), plus interest & time saved. _Only includes values actually computed_ — no
  stale, undefined, or invented figures.
- **Share calculator** — a short invitation with the public URL, no result figures.

Both open `https://wa.me/?text=<encoded>`; if the popup is blocked they copy the text to the
clipboard. The URL suffix reads `VITE_PUBLIC_URL` (never hardcoded localhost).

## Design

UI follows the approved designs in `design_references/` (desktop + mobile) — same layout, tokens
(Tailwind), and behaviour (metric cards in a 2×2 grid, interest chart with `bg-surface-container`
block). If layouts are ever rebuilt, keep those binaries as the source of truth.

## Deployment

Frontend → **Vercel**, backend → **Render**. Both run as separate services; the frontend is a
static SPA, the backend a FastAPI web service (no database, no persistence in V1).

### Frontend — Vercel

1. Import the repository into Vercel.
2. **Framework preset:** Vite (auto-detected) · **Root directory:** `frontend`
3. Build command: `npm run build` (runs `tsc -b && vite build`) · Output directory: `dist`
   (auto-detected from Vite).
4. Add environment variables (see copy-paste table below):
   - `VITE_API_BASE_URL` → your Render backend URL
   - `VITE_PUBLIC_URL` → your Vercel production URL
5. `frontend/vercel.json` already contains a catch-all SPA rewrite so `/privacy`, `/terms`,
   `/assumptions`, `/disclaimer` (and any direct refresh) resolve to the app instead of 404ing.
6. Deploy.

> `VITE_PUBLIC_URL` is **build-time**: it is inlined by Vite and feeds the share links plus the
> generated `robots.txt` / `sitemap.xml`. After changing it, trigger a **rebuild** — a redeploy
> with cached output will keep the old value.

### Backend — Render

1. Create a new **Web Service** and connect the repository.
2. **Root directory:** `backend`
3. **Python version:** the Render default (3.11/3.12/3.13 all work with this app).
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   (equivalent `backend/Procfile`: `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`)
6. Add environment variables (see table below):
   - `FRONTEND_ORIGINS` → your Vercel production URL
7. Deploy, then verify **`GET /health`** returns `{"status": "ok"}`.
8. If the final Vercel domain differs from what you set in `FRONTEND_ORIGINS`, update it and
   redeploy the backend (CORS is read at startup).

### Deployment order

1. Deploy the **backend** to Render first — get its URL.
2. Set Render env `FRONTEND_ORIGINS=https://YOUR_PROJECT.vercel.app`.
3. Set Vercel env `VITE_API_BASE_URL=https://YOUR-RENDER-BACKEND.onrender.com` and
   `VITE_PUBLIC_URL=https://YOUR_PROJECT.vercel.app`.
4. Deploy (build) the frontend.
5. Smoke-test the production app (see checklist in the package notes).
6. If the final Vercel domain changes, update both env vars and **rebuild** the frontend +
   redeploy backend.

### Environment variables (copy-paste table)

| Platform | Variable | Value |
| --- | --- | --- |
| Vercel (build) | `VITE_API_BASE_URL` | `https://YOUR-RENDER-BACKEND.onrender.com` |
| Vercel (build) | `VITE_PUBLIC_URL` | `https://YOUR_PROJECT.vercel.app` |
| Render | `FRONTEND_ORIGINS` | `https://YOUR_PROJECT.vercel.app` |

- The backend has **no `PUBLIC_URL`** var in code (`PUBLIC_URL` exists only in the frontend as
  `VITE_PUBLIC_URL`). Do not add unused vars.
- `FRONTEND_ORIGINS` accepts a comma-separated list; localhost dev origins are the built-in
  default, so local development still works without setting anything.

## Roadmap / status

- Core calculator, extra-payment strategy, lump-sum + target-term inputs, metric grid, interest
  chart, WhatsApp sharing (results + calculator), header — **done and verified** (tsc + oxlint +
  tests green).
- Env hygiene: `VITE_PUBLIC_URL` must be supplied at build for any deployed environment.
- Node engine: bump to `>=22.12` when convenient.
