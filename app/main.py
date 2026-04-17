from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from starlette.responses import FileResponse

from app.database import init_db

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Free Call", lifespan=lifespan)

# API routers - must come BEFORE catch-all
from app.routers import proxy, collections, history, environments, import_export  # noqa: E402

app.include_router(proxy.router)
app.include_router(collections.router)
app.include_router(history.router)
app.include_router(environments.router)
app.include_router(import_export.router)

# Serve frontend
if (FRONTEND_DIST / "index.html").exists():
    # Production: serve Vite build output
    if (FRONTEND_DIST / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Try to serve static file first
        file_path = FRONTEND_DIST / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        # Fallback to SPA index.html
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    # Development fallback: serve old Jinja2 templates
    app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
    templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

    @app.get("/")
    async def root(request: Request):
        return templates.TemplateResponse(request, "index.html")
