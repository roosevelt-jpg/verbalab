"""Speech engines that run inside the Lugemi TTS container. No third-party speech APIs."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import numpy as np


@dataclass
class Audio:
    pcm: np.ndarray  # mono int16
    sample_rate: int


class Engine(Protocol):
    def synthesize(self, text: str, speed: float) -> Audio: ...


def _to_int16(samples: np.ndarray) -> np.ndarray:
    if samples.dtype == np.int16:
        return samples
    clipped = np.clip(samples.astype(np.float32), -1.0, 1.0)
    return (clipped * 32767.0).astype(np.int16)


class KokoroModel:
    """Shared Kokoro weights (Apache-2.0, self-hosted). One instance serves every Kokoro voice."""

    def __init__(self, model_path: Path, voices_path: Path) -> None:
        from kokoro_onnx import Kokoro

        self._kokoro = Kokoro(str(model_path), str(voices_path))

    def synthesize(self, text: str, voice: str, lang: str, speed: float) -> Audio:
        samples, sample_rate = self._kokoro.create(text, voice=voice, speed=speed, lang=lang)
        return Audio(pcm=_to_int16(np.asarray(samples)), sample_rate=int(sample_rate))


class KokoroVoice:
    def __init__(self, model: KokoroModel, voice: str, lang: str) -> None:
        self._model = model
        self._voice = voice
        self._lang = lang

    def synthesize(self, text: str, speed: float) -> Audio:
        return self._model.synthesize(text, self._voice, self._lang, speed)


class PiperVoiceEngine:
    """A voice Lugemi trained on its own native-speaker recordings, exported to ONNX (VITS)."""

    def __init__(self, model_path: Path) -> None:
        from piper import PiperVoice

        self._voice = PiperVoice.load(str(model_path))

    def synthesize(self, text: str, speed: float) -> Audio:
        from piper import SynthesisConfig

        config = SynthesisConfig(length_scale=1.0 / max(speed, 0.25))
        chunks = list(self._voice.synthesize(text, syn_config=config))
        if not chunks:
            return Audio(pcm=np.zeros(0, dtype=np.int16), sample_rate=self._voice.config.sample_rate)
        pcm = np.concatenate([np.frombuffer(c.audio_int16_bytes, dtype=np.int16) for c in chunks])
        return Audio(pcm=pcm, sample_rate=chunks[0].sample_rate)
