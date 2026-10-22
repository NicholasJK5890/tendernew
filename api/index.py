"""
Vercel serverless entrypoint (single-project deployment).

The React frontend is served as static files from the CDN and every request to
/api/* is routed to this function, which mounts the FastAPI backend under /api.
(The backend itself defines routes like /users, /tenders ... without a prefix,
so it also keeps working standalone for local development and for the optional
two-project layout in backend/.)
"""
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

# Make backend modules (main, models, database, services, seed ...) importable.
sys.path.insert(0, str(BACKEND_DIR))
# SQLite fallback / relative paths inside the backend expect to run from backend/.
try:
    os.chdir(BACKEND_DIR)
except OSError:
    pass

from fastapi import FastAPI  # noqa: E402
from main import app as backend_app  # noqa: E402

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/api", backend_app)
