# 🛡️ TenderLens — Autonomous AI Verification Agent for Indian Government Procurement

> **"Verify the vendor's claims. Don't just read them."**

TenderLens is a hackathon prototype designed to eliminate tender fraud, cartels, and substandard supplies in Indian public procurement. Rather than relying on vendors' self-declarations, TenderLens deploys autonomous verification agents to cross-examine claims against official statutory registries (Bureau of Indian Standards / BIS Manakonline, GST Common Portal, MCA21 Ministry of Corporate Affairs, and GeM pricing intelligence).

---

## 📸 Key Design & Architecture

- **Frontend**: React 19 + Vite + TypeScript, Tailwind CSS, Recharts for smooth multi-line data curves, Lucide icons.
- **Backend**: Python FastAPI + Pydantic v2 + SQLite (SQLAlchemy ORM) + ReportLab for official PDF evaluation reports.
- **Agents**: Asynchronous Python tasks with [TinyFish](https://tinyfish.io) web automation wrapper (`services/tinyfish_client.py`). Falls back gracefully to pre-cached realistic evidence screenshots marked **"cached demo evidence"** if an API key is absent.
- **Document Extractor**: Pluggable LLM extractor (`services/extractor.py`) with per-field confidence scoring and low-confidence highlights. Runs offline with high-fidelity fallback.
- **Compliance Engine**: **100% deterministic Python rules**. Pass/fail decisions and L1/QCBS rankings are never delegated to an LLM.

---

## 🚀 Quickstart & One-Command Run

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt # or: pip install fastapi uvicorn sqlalchemy python-multipart reportlab aiofiles pillow httpx
python seed.py                          # Recreates & seeds realistic Indian procurement tenders & bids
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*API docs are automatically generated at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Access the Web Application at: [http://127.0.0.1:5173](http://127.0.0.1:5173)*

---

## ⚙️ Environment Variables

Create a `.env` file in `backend/` (optional — works out of the box with cached demo evidence):

```env
# Optional TinyFish API key for live web automation (BIS, GSTIN, MCA lookup)
TINYFISH_API_KEY=your_tinyfish_key_here

# Optional LLM API key for Document Extraction
LLM_API_KEY=your_openai_or_gemini_key_here
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-4o-mini

# Database URL (Defaults to SQLite tenderlens.db)
DATABASE_URL=sqlite:///./tenderlens.db
```

---

## ☁️ Deploying to Vercel (single project — recommended)

One Vercel project serves both the React app (CDN) and the FastAPI backend (serverless function under `/api`).

1. Push this repo to GitHub (or run `vercel` from the repo root).
2. In Vercel: **Add New → Project → import the repo**. Keep **Root Directory = repo root** (not `frontend/` or `backend/`). Framework Preset: **Other**. Leave Build/Install/Output settings alone — `vercel.json` sets them.
3. Deploy. Check `https://<your-app>.vercel.app/api/health` returns JSON, then open the site.

**How it is wired**
- `vercel.json` builds `frontend/` → `frontend/dist`, and rewrites `/api/*` to `api/index.py`.
- `api/index.py` imports `backend/main.py` and mounts it under `/api`.
- Evidence screenshots are served from `frontend/public/static/evidence/`.
- Python is pinned to 3.12 (`.python-version`) and `requirements.txt` has exact tested versions.

**Database (important)** — Vercel functions have a read-only filesystem.
- With no env vars the app falls back to SQLite in `/tmp`: it auto-seeds on every cold start and **data does not persist** (and is not shared between function instances). Fine for a demo.
- For persistence, add a hosted Postgres (Vercel Marketplace → Neon/Supabase) and set `DATABASE_URL` (or `POSTGRES_URL`) in Project → Settings → Environment Variables, then redeploy. Tables are created and seeded automatically on first request.
- Optional: `TINYFISH_API_KEY`, `LLM_API_KEY`, `LLM_API_URL`, `LLM_MODEL` as described above.

**Two-project layout (optional):** deploy `backend/` and `frontend/` as separate Vercel projects (each with its own Root Directory). Edit the backend URL in `frontend/vercel.json` to your backend's domain.

---

## ⏱️ 3-Minute Hackathon Demo Script

Follow this step-by-step walkthrough to experience the end-to-end autonomous verification pipeline:

### Step 1: Login & Role Selection
1. Open [http://127.0.0.1:5173](http://127.0.0.1:5173).
2. Click **"I am a Government Officer"** (logs in as **Rajesh Sharma, Chief Engineer, CPWD**).

### Step 2: Ingest Tender NIT & Human-in-the-Loop Review
1. Click **"+ Create Tender"** or go to **"Upload & Review NIT"** in the sidebar.
2. Click **"Run Document Extractor Agent ->"**.
3. Notice that the Extractor parses 6 procurement parameters with confidence scores and highlights **Initial Setting Time** in amber (74% confidence) as a low-confidence item requiring officer confirmation.
4. Click **"Confirm & Publish Tender ->"** to lock the deterministic compliance checklist.

### Step 3: Run Live Multi-Agent Evaluation on Tender C-409 (Cement IS 269)
1. In the Dashboard or Tender Management, open **Tender CPWD/ND-II/2026/C-409** (50,000 Bags 43-Grade OPC).
2. View the 4 submitted bids:
   - **Vendor A (Shree Ram Cement Ltd)**: ₹340.00 / bag (Cheapest bid)
   - **Vendor B (Ultracem Infra Solutions Pvt Ltd)**: ₹365.00 / bag
   - **Vendor C (Ambuja & Bharat Cements Corp)**: ₹372.00 / bag
   - **Vendor D (Apex Buildtech Enterprises)**: ₹290.00 / bag (Abnormally low)
3. Click **"Run Live Evaluation Pipeline"**.
4. Watch parallel agents verify licences on **BIS Manakonline**, validate **GSTIN status**, and analyze the **GeM pricing & collusion graph**.

### Step 4: Deterministic Verdict & Proof Inspection
1. **Vendor A is DISQUALIFIED**: Despite being the cheapest quote (₹340), automated BIS registry verification confirmed that licence `CM/L-4829103` expired on 31-Dec-2025.
   - Click **"View Screenshot"** on the evidence link to see the authentic BIS search screenshot.
2. **Vendor D is RED-FLAGGED**: Quoted ₹290 (21.6% below GeM market floor) and the entity graph detected that it shares its registered address and a common director (`Kailash Chand Sharma`) with Vendor A.
3. **Vendor B is QUALIFIED as L1 WINNER**: Holds active BIS licence `CM/L-7182934`, active GSTIN, and meets all physical test parameters under IS 4031.
4. Click **"Download PDF Report"** to generate the official Government Evaluation Report with file noting signatures.
5. Click **"Approve & Award"** to record your officer file note and award the contract.

### Step 5: Switch to Vendor Portal
1. In the top bar, click the user profile pill and select **"Ultracem Infra Solutions"** or **"Shree Ram Cement"**.
2. Notice:
   - Real-time in-app notification indicating L1 qualification or disqualification grounds.
   - Profile completeness milestone battery bars.
   - **Pre-submission compliance check** on Tender Discovery that warns vendors if they fail mandatory criteria before bidding!
   - Clarifications Inbox to respond to officer queries.

---

## 📂 Project Structure

```
tendernew/
├── backend/
│   ├── main.py                          # FastAPI application & routes
│   ├── models.py                        # SQLAlchemy database models
│   ├── database.py                      # SQLite database connection
│   ├── schemas.py                       # Pydantic v2 validation models
│   ├── seed.py                          # Realistic seed data script
│   ├── generate_evidence_mock_images.py # Pillow mock evidence generator
│   ├── rulebooks/                       # JSON rulebooks (one pipeline, many categories)
│   │   ├── cement.json                  # IS 269:2015 & IS 4031 OPC/PPC specs
│   │   ├── steel.json                   # IS 1786:2008 Fe 500D TMT specs
│   │   ├── pipes.json                   # IS 4985:2021 uPVC pipes specs
│   │   └── services.json                # QCBS 70/30 consulting specs
│   ├── services/
│   │   ├── tinyfish_client.py           # TinyFish web agent client & cached fallback
│   │   ├── extractor.py                 # Pluggable NIT/bid document extractor
│   │   ├── compliance_engine.py         # 100% deterministic compliance engine & ranking
│   │   └── report_generator.py          # ReportLab PDF report generator
│   └── static/
│       ├── evidence/                    # Pre-generated registry screenshots
│       └── reports/                     # Generated evaluation PDFs
└── frontend/
    ├── src/
    │   ├── components/                  # UI components (KPI, Sidebar, Topbar, Milestone, etc.)
    │   ├── views/                       # Full portal views for Officer & Vendor
    │   ├── services/                    # API service layer
    │   └── types/                       # TypeScript interfaces
    └── package.json
```
