"""Lugemi speech engine: HTTP contract consumed by the API's OWN_TTS_URL adapter.

POST /  (or /synthesize)  JSON { text, voice, language?, format?, speed? } -> audio bytes
GET  /voices              voices this engine can speak right now
POST /admin/reload        re-sync trained voices from object storage and rescan MODELS_DIR
"""

from __future__ import annotations

import asyncio
import hmac
import logging
import os
import time

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from .encode import MIME, encode
from .registry import VoiceInfo, VoiceRegistry
from .sync import sync_models

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
log = logging.getLogger("lugemi.tts")

MAX_CHARS = int(os.environ.get("TTS_MAX_CHARS", "5000"))

registry = VoiceRegistry()
app = FastAPI(title="Lugemi speech engine", docs_url=None, redoc_url=None, openapi_url=None)
_slots = asyncio.Semaphore(int(os.environ.get("TTS_CONCURRENCY", str(os.cpu_count() or 2))))


class SynthesisRequest(BaseModel):
    text: str = Field(min_length=1)
    voice: str = Field(min_length=1)
    language: str | None = None
    format: str = "mp3"
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


def _error(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message})


def _require_key(authorization: str | None) -> None:
    expected = os.environ.get("TTS_API_KEY", "").strip()
    if not expected:
        return
    supplied = (authorization or "").removeprefix("Bearer ").strip()
    if not hmac.compare_digest(supplied, expected):
        raise _error(401, "unauthorized", "Missing or invalid engine key")


def language_matches(voice: VoiceInfo, language: str | None) -> bool:
    """`ak` matches `ak-GH`; a regional request (`en-AU`) only matches that region's voice."""
    if not language:
        return True
    want = language.strip().replace("_", "-").lower().split("-")
    have = voice.locale.lower().split("-")
    if want[0] != have[0]:
        return False
    if len(want) > 1 and len(have) > 1 and len(want[1]) == 2:
        return want[1] == have[1]
    return True


@app.on_event("startup")
def _startup() -> None:
    try:
        sync_models(registry.models_dir)
    except Exception as error:  # storage outage must not stop the built-in voices
        log.warning("voice sync failed: %s", error)
    registry.load()


@app.exception_handler(HTTPException)
async def _http_error(_request: Request, exc: HTTPException) -> JSONResponse:
    body = exc.detail if isinstance(exc.detail, dict) else {"code": "error", "message": str(exc.detail)}
    return JSONResponse(status_code=exc.status_code, content={"error": body})


@app.get("/health")
def health() -> dict:
    return {"ok": True, "voices": len(registry.list())}


@app.get("/voices")
def voices(authorization: str | None = Header(default=None)) -> dict:
    _require_key(authorization)
    return {"voices": [v.public() for v in registry.list()]}


@app.post("/admin/reload")
async def reload(authorization: str | None = Header(default=None)) -> dict:
    _require_key(authorization)
    fetched = await run_in_threadpool(sync_models, registry.models_dir)
    await run_in_threadpool(registry.load)
    return {"fetched": fetched, "voices": [v.id for v in registry.list()]}


async def _synthesize(body: SynthesisRequest, authorization: str | None) -> Response:
    _require_key(authorization)
    text = body.text.strip()
    if not text:
        raise _error(400, "validation_error", "text is required")
    if len(text) > MAX_CHARS:
        raise _error(400, "validation_error", f"text is limited to {MAX_CHARS} characters")
    fmt = body.format.lower()
    if fmt not in MIME:
        raise _error(400, "validation_error", f"Unsupported format: {body.format}")

    voice = registry.get(body.voice)
    if voice is None:
        raise _error(422, "native_voice_unavailable", f'Voice "{body.voice}" is not live on this engine')
    if not language_matches(voice, body.language):
        raise _error(
            422,
            "native_voice_unavailable",
            f"{voice.name} is a native {voice.locale} voice and does not speak {body.language}",
        )

    engine = await run_in_threadpool(registry.engine, voice.id)
    if engine is None:
        raise _error(503, "voice_not_loaded", f'Voice "{voice.id}" could not be loaded')

    started = time.perf_counter()
    async with _slots:
        audio = await run_in_threadpool(engine.synthesize, text, body.speed)
        data = await run_in_threadpool(encode, audio, fmt)
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    seconds = len(audio.pcm) / audio.sample_rate if audio.sample_rate else 0
    log.info("synth voice=%s chars=%d audio=%.2fs took=%dms", voice.id, len(text), seconds, elapsed_ms)
    return Response(
        content=data,
        media_type=MIME[fmt],
        headers={
            "X-Lugemi-Voice": voice.id,
            "X-Audio-Seconds": f"{seconds:.3f}",
            "X-Synthesis-Ms": str(elapsed_ms),
            "Cache-Control": "no-store",
        },
    )


@app.post("/")
async def synthesize_root(body: SynthesisRequest, authorization: str | None = Header(default=None)) -> Response:
    return await _synthesize(body, authorization)


@app.post("/synthesize")
async def synthesize(body: SynthesisRequest, authorization: str | None = Header(default=None)) -> Response:
    return await _synthesize(body, authorization)
