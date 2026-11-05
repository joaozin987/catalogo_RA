import mimetypes
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

mimetypes.add_type("image/webp", ".webp")

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="Cardápio 3D - Protótipo")


@app.middleware("http")
async def sem_cache(request, call_next):
    # Evita que o celular ou o túnel mostrem arquivos antigos durante o desenvolvimento
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    return response

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


def page(name: str) -> str:
    return (BASE_DIR / "templates" / name).read_text(encoding="utf-8")


@app.get("/", response_class=HTMLResponse)
def home():
    return page("index.html")


@app.get("/ar", response_class=HTMLResponse)
def ar_view():
    return page("ar.html")


@app.get("/camera", response_class=HTMLResponse)
def camera_view():
    return page("camera.html")