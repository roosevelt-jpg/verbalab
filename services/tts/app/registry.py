"""Which voices this engine can speak right now.

Built-in voices come from `voices.json` (kokoro + demo engines). Additional ONNX voices
dropped into MODELS_DIR as `<id>.onnx` + `<id>.onnx.json` + `<id>.lugemi.json` are served
when `<id>.lugemi.json` records a native-speaker reviewer's approval.
"""

from __future__ import annotations

import json
import logging
import os
import threading
from dataclasses import dataclass, field
from pathlib import Path

from .engines import DemoToneEngine, Engine, KokoroModel, KokoroVoice, PiperVoiceEngine

log = logging.getLogger("lugemi.tts.registry")

APP_DIR = Path(__file__).resolve().parent.parent


@dataclass
class VoiceInfo:
    id: str
    name: str
    locale: str
    gender: str
    engine: str
    approved_by: str | None = None
    options: dict = field(default_factory=dict)

    def public(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "locale": self.locale,
            "gender": self.gender,
            "engine": self.engine,
            "approvedBy": self.approved_by,
        }


class VoiceRegistry:
    def __init__(
        self,
        manifest_path: Path | None = None,
        models_dir: Path | None = None,
        kokoro_dir: Path | None = None,
    ) -> None:
        self.manifest_path = manifest_path or APP_DIR / "voices.json"
        self.models_dir = models_dir or Path(os.environ.get("MODELS_DIR", "/data/voices"))
        self.kokoro_dir = kokoro_dir or Path(os.environ.get("KOKORO_DIR", str(APP_DIR / "models" / "kokoro")))
        self._lock = threading.Lock()
        self._voices: dict[str, VoiceInfo] = {}
        self._engines: dict[str, Engine] = {}
        self._kokoro: KokoroModel | None = None

    def _kokoro_model(self) -> KokoroModel | None:
        if self._kokoro is not None:
            return self._kokoro
        model = self.kokoro_dir / os.environ.get("KOKORO_MODEL_FILE", "kokoro-v1.0.onnx")
        voices = self.kokoro_dir / "voices-v1.0.bin"
        if not model.exists() or not voices.exists():
            log.warning("kokoro model files missing in %s", self.kokoro_dir)
            return None
        self._kokoro = KokoroModel(model, voices)
        return self._kokoro

    def load(self) -> None:
        voices: dict[str, VoiceInfo] = {}
        builtin = json.loads(self.manifest_path.read_text(encoding="utf-8"))
        kokoro_ready = (self.kokoro_dir / "voices-v1.0.bin").exists()
        for entry in builtin:
            engine_name = entry["engine"]
            # Cultural / African catalog voices ship as demo when kokoro weights are absent.
            if engine_name == "kokoro" and not kokoro_ready:
                engine_name = "demo"
            voices[entry["id"]] = VoiceInfo(
                id=entry["id"],
                name=entry["name"],
                locale=entry["locale"],
                gender=entry["gender"],
                engine=engine_name,
                approved_by=entry.get("approvedBy"),
                options=entry.get("options", {}),
            )

        if self.models_dir.exists():
            for meta_path in sorted(self.models_dir.glob("*.lugemi.json")):
                voice_id = meta_path.name.removesuffix(".lugemi.json")
                onnx = self.models_dir / f"{voice_id}.onnx"
                config = self.models_dir / f"{voice_id}.onnx.json"
                try:
                    meta = json.loads(meta_path.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError) as error:
                    log.warning("skipping %s: %s", meta_path.name, error)
                    continue
                if not onnx.exists() or not config.exists():
                    log.warning("skipping %s: model files missing", voice_id)
                    continue
                if not meta.get("approved") or not meta.get("approvedBy"):
                    log.info("voice %s not approved by a native reviewer yet", voice_id)
                    continue
                voices[voice_id] = VoiceInfo(
                    id=voice_id,
                    name=meta.get("name", voice_id),
                    locale=meta.get("locale", ""),
                    gender=meta.get("gender", "neutral"),
                    engine="piper",
                    approved_by=meta["approvedBy"],
                    options={"model": str(onnx)},
                )

        with self._lock:
            stale = [vid for vid in self._engines if vid not in voices]
            for vid in stale:
                self._engines.pop(vid, None)
            self._voices = voices
        log.info("voices ready: %s", ", ".join(sorted(voices)) or "none")

    def list(self) -> list[VoiceInfo]:
        with self._lock:
            return list(self._voices.values())

    def get(self, voice_id: str) -> VoiceInfo | None:
        with self._lock:
            return self._voices.get(voice_id)

    def engine(self, voice_id: str) -> Engine | None:
        with self._lock:
            info = self._voices.get(voice_id)
            if info is None:
                return None
            cached = self._engines.get(voice_id)
            if cached is not None:
                return cached
            if info.engine == "kokoro":
                model = self._kokoro_model()
                if model is None:
                    engine = DemoToneEngine(voice_id)
                else:
                    engine = KokoroVoice(model, info.options["voice"], info.options["lang"])
            elif info.engine == "demo":
                engine = DemoToneEngine(voice_id)
            else:
                engine = PiperVoiceEngine(Path(info.options["model"]))
            self._engines[voice_id] = engine
            return engine
