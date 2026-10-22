# 🛡️ TenderLens

**Autonomous verification for Indian government procurement.**
*Verify the vendor's claims. Don't just read them.*

TenderLens is a working prototype that checks what bidders *claim* against what official registries *say*. Instead of trusting self-declarations, it cross-examines each bid against BIS (Manakonline) licences, GST status, MCA company records and GeM price benchmarks, then ranks the bids with a fully deterministic rules engine.

> **No API keys, accounts or paid services are needed to run or deploy TenderLens.**
> Out of the box it runs in **Demo Mode** with realistic seeded data and cached registry evidence (clearly labelled "cached demo evidence" in the UI). Keys are only needed if you want to switch individual features to *Live Mode* — see [Demo Mode vs Live Mode](#demo-mode-vs-live-mode).

---

## Features

**For procurement officers**
- Upload / paste a Notice Inviting Tender (NIT) and review the extracted requirements, with per-field confidence scores and low-confidence items highlighted for human confirmation.
- Publish a tender with a locked, deterministic compliance checklist.
- One-click evaluation across all bids: licence validity, GSTIN status, company records, price anomaly and shared-director/address checks.
- Evidence viewer showing the registry screenshot behind every pass/fail.
- L1 and QCBS (70/30) ranking, official PDF evaluation report, approval with file notes, and a full audit log.

**For vendors**
- Profile wizard with completeness tracking.
- Tender discovery with a **pre-submission compliance check** that warns you before you bid on something you would fail.
- Application tracker, notifications and a clarifications inbox.

**Design principle:** pass/fail decisions and rankings are **100% deterministic Python rules**. An LLM is never used to decide who qualifies.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4, Recharts, Lucide |
| Backend | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2 |
| Database | SQLite (default) or PostgreSQL |
| Reports | ReportLab (PDF) |
| Hosting | Vercel (static frontend + serverless FastAPI) |

---

## Demo Mode vs Live Mode

| Capability | Demo Mode (default, no keys) | Live Mode (optional) |
|---|---|---|
| Registry checks (BIS / GST / MCA) | Cached evidence with pre-rendered screenshots, labelled "cached demo evidence" | Calls a TinyFish web-automation agent when `TINYFISH_API_KEY` is set; falls back to cached evidence if the call fails |
| NIT extraction | Built-in high-fidelity sample extractor | Calls an OpenAI-compatible LLM when `LLM_API_KEY` is set **and** NIT text is pasted into the text box |
| Compliance rules and ranking | Deterministic Python | Deterministic Python (never delegated to an LLM) |
| Data | Seeded Indian procurement tenders and bids | Same |

So the answer to "do I need an API key?" is **no**. Add one only if you want that specific feature to run live.

---

## Quick start (local)

**Prerequisites:** Python 3.12+ and Node.js 20+.

```bash
# 1. Backend  (http://127.0.0.1:8000, interactive docs at /docs)
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# 2. Frontend (new terminal)  (http://127.0.0.1:5173)
cd frontend
npm install
npm run dev
```

The database is created and seeded automatically on first start. To reset it to a clean seeded state, run `python seed.py` from `backend/`.

The Vite dev server proxies `/api` and `/static` to the backend, so no extra configuration is needed.

---

## Configuration (all optional)

Copy `backend/.env.example` to `backend/.env` for local development. Nothing below is required.

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` (or `POSTGRES_URL`) | Database connection string | local SQLite file |
| `TINYFISH_API_KEY` | Enables live registry verification | unset → Demo Mode |
| `TINYFISH_BASE_URL` | TinyFish API base URL | `https://api.tinyfish.io/v1` |
| `TINYFISH_TIMEOUT` | Seconds before falling back to cached evidence | `10` |
| `LLM_API_KEY` | Enables LLM-based NIT extraction | unset → built-in extractor |
| `LLM_API_URL` | Any OpenAI-compatible chat completions endpoint | OpenAI |
| `LLM_MODEL` | Model name | `gpt-4o-mini` |

Frontend (build-time, optional): `VITE_API_BASE` — point the UI at a separately hosted backend. Defaults to same-origin `/api`.

---

## Deploying to Vercel

One Vercel project serves both the React app (CDN) and the FastAPI backend (serverless function under `/api`).

1. Push the repo to GitHub.
2. In Vercel: **Add New → Project →** import the repo.
3. Keep **Root Directory** as the repo root (`./`), set **Framework Preset** to **Other**, and leave the build settings alone (`vercel.json` configures them).
4. Deploy, then open `https://<your-app>.vercel.app/api/health` — it should return JSON.

**How it is wired:** `vercel.json` builds `frontend/` into `frontend/dist` and rewrites `/api/*` to `api/index.py`, which mounts `backend/main.py` under `/api`. Python is pinned to 3.12 and `requirements.txt` uses exact tested versions.

**Database on Vercel:** the function filesystem is read-only. Without a database URL, TenderLens uses SQLite in `/tmp`, which re-seeds on every cold start — data does **not** persist and is not shared between instances. That is fine for a demo. For persistence, add a hosted Postgres (Vercel Marketplace → Neon or Supabase) so `DATABASE_URL` / `POSTGRES_URL` is set, then redeploy. Tables and seed data are created automatically on first request.

---

## Demo walkthrough (3 minutes)

1. **Log in** — click *I am a Government Officer* (Rajesh Sharma, Chief Engineer, CPWD).
2. **Ingest a NIT** — open *Upload & Review NIT* and run the extractor. Six parameters are parsed; *Initial Setting Time* is flagged amber (74% confidence) for officer confirmation. Confirm and publish.
3. **Evaluate** — open tender `CPWD/ND-II/2026/C-409` (50,000 bags of 43-grade OPC, four bids) and click **Run Live Evaluation Pipeline**.
4. **Inspect the verdicts**
   - **Vendor A — Disqualified.** Cheapest at ₹340/bag, but BIS licence `CM/L-4829103` expired on 31-Dec-2025. Open *View Screenshot* to see the evidence.
   - **Vendor D — Red-flagged.** ₹290/bag is 21.6% below the GeM market floor, and it shares an address and a director with Vendor A.
   - **Vendor B — Qualified, L1 winner.** Active BIS licence and GSTIN, meets IS 4031 test parameters.
5. **Report and award** — download the PDF evaluation report, then *Approve & Award* with a file note.
6. **Vendor view** — switch to a vendor from the top bar to see the award/disqualification notification, profile completeness, pre-submission checks and the clarifications inbox.

---

## API overview

Interactive docs are served at `/docs` (local backend). Main endpoint groups:

| Area | Endpoints |
|---|---|
| Users | `GET /users`, `GET /users/me` |
| Vendors | `GET/PUT /vendors/me`, `GET /vendors/me/matches`, `GET /vendors/me/applications` |
| Tenders | `GET/POST /tenders`, `GET /tenders/{id}`, `POST /tenders/upload`, `POST /tenders/{id}/confirm` |
| Bids and evaluation | `GET/POST /tenders/{id}/bids`, `POST /tenders/{id}/evaluate`, `POST /tenders/{id}/approve`, `GET /tenders/{id}/report` |
| Documents | `POST /bids/{id}/documents` |
| Clarifications | `GET/POST /clarifications`, `POST /clarifications/{id}/reply` |
| Other | `GET /notifications`, `GET /categories`, `GET /categories/{name}/rulebook`, `GET /audit-log`, `GET /stats/dashboard`, `GET /health` |

On the deployed site, prefix every path with `/api`.

---

## Project structure

```
tendernew/
├── api/
│   └── index.py                 # Vercel serverless entrypoint (mounts backend under /api)
├── vercel.json                  # Build, rewrites and function config
├── requirements.txt             # Python dependencies for Vercel (pinned)
├── backend/
│   ├── main.py                  # FastAPI app and routes
│   ├── models.py                # SQLAlchemy models
│   ├── schemas.py               # Pydantic schemas
│   ├── database.py              # SQLite/Postgres connection
│   ├── seed.py                  # Seed data
│   ├── rulebooks/               # JSON rulebooks per category (cement, steel, pipes, services)
│   ├── services/
│   │   ├── tinyfish_client.py   # Live registry agent client + cached fallback
│   │   ├── extractor.py         # NIT / bid document extractor (LLM optional)
│   │   ├── compliance_engine.py # Deterministic compliance rules and ranking
│   │   └── report_generator.py  # PDF evaluation report
│   └── static/evidence/         # Registry evidence screenshots
└── frontend/
    ├── src/
    │   ├── components/          # Shared UI components
    │   ├── views/               # Officer and vendor screens
    │   ├── services/api.ts      # API client
    │   └── types/               # TypeScript types
    └── public/static/evidence/  # Evidence images served by the CDN
```

---

## Known limitations

TenderLens is a prototype. Be aware of the following before using it beyond a demo:

- **Demo authentication only.** Users are switched via an `X-User-Email` header with no passwords or tokens. Do not expose it with real data.
- **Uploaded PDFs are not parsed.** The extractor currently receives the file *name*; only pasted NIT text is sent to the LLM, and without a key a built-in sample is returned.
- **Live registry integration is unverified.** The TinyFish request format in `services/tinyfish_client.py` is a scaffold; confirm it against your TinyFish account's API documentation before relying on live results.
- **Cached evidence is simulated.** Demo-mode screenshots are pre-rendered images, not real registry captures.
- **Ephemeral data on Vercel without Postgres** (see above).

---

## License

Hackathon prototype — add a license of your choice before wider distribution.
