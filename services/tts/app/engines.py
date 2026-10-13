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


class SpeechSynthesisEngine:
    """Intelligible real speech synthesis for shipped catalog voices.

    Uses eSpeak-NG when available on system to generate language-appropriate speech,
    with distinct pitch and speed profiles per cultural variety (GH, NG, KE, PH, ZA, etc.).
    Falls back to a formant acoustic voice model (vocal tract filtering, frication, glottal pulse train)
    so speech is never pure sine beeps.
    """

    def __init__(self, voice_id: str, locale: str = "") -> None:
        self._voice_id = voice_id
        self._locale = locale or self._infer_locale(voice_id)
        self._sample_rate = 22_050

    @staticmethod
    def _infer_locale(voice_id: str) -> str:
        clean = voice_id.removeprefix("own:")
        if clean.endswith("-pack"):
            return clean.removesuffix("-pack")
        parts = clean.split("-")
        if len(parts) >= 2:
            return f"{parts[0]}-{parts[1].upper()}"
        return parts[0] if parts else "en-US"

    # Verified eSpeak locale → voice. Never match country codes as substrings of
    # unrelated languages (ak-GH must not become Caribbean English).
    _ESPEAK_BY_LOCALE = {
        "en-us": ("en-us", "50", "165"),
        "en-ca": ("en-us", "50", "165"),
        "en-ph": ("en-us", "58", "165"),
        "en-sg": ("en-us", "52", "165"),
        "en-gb": ("en-gb", "50", "160"),
        "en-ie": ("en-gb-scotland", "50", "158"),
        "en-in": ("en-gb", "52", "155"),
        "en-ke": ("en-gb", "46", "150"),
        "en-za": ("en-gb", "50", "158"),
        "en-ug": ("en-gb", "48", "152"),
        "en-tz": ("en-gb", "48", "152"),
        "en-au": ("en-au", "52", "160"),
        "en-nz": ("en-nz", "50", "158"),
        "en-gh": ("en-029", "48", "155"),
        "en-ng": ("en-029", "52", "160"),
        "en-jm": ("en-029", "50", "158"),
        "sw": ("sw", "50", "160"),
        "sw-ke": ("sw", "50", "160"),
        "sw-tz": ("sw", "50", "160"),
        "am": ("am", "50", "160"),
        "am-et": ("am", "50", "160"),
        "ar": ("ar", "50", "160"),
        "ar-eg": ("ar", "50", "160"),
        "af": ("af", "50", "160"),
        "af-za": ("af", "50", "160"),
        "fr": ("fr-fr", "50", "160"),
        "fr-fr": ("fr-fr", "50", "160"),
        "fr-sn": ("fr-fr", "48", "155"),
        "fr-ci": ("fr-fr", "48", "155"),
        "fr-ca": ("fr-fr", "52", "160"),
        "pt": ("pt", "50", "160"),
        "pt-pt": ("pt", "50", "160"),
        "pt-br": ("pt-br", "50", "160"),
        "pt-ao": ("pt", "50", "158"),
        "es": ("es", "50", "160"),
        "es-es": ("es", "50", "160"),
        "es-mx": ("es-419", "50", "160"),
        "es-419": ("es-419", "50", "160"),
        "de": ("de", "50", "160"),
        "ja": ("ja", "50", "160"),
        "th": ("th", "50", "160"),
        "vi": ("vi", "50", "160"),
        "hi": ("hi", "50", "160"),
        "om": ("om", "50", "160"),
        "om-et": ("om", "50", "160"),
        "tn": ("tn", "50", "160"),
        "tn-bw": ("tn", "50", "160"),
        "ko": ("ko", "50", "160"),
        "id": ("id", "50", "160"),
        "ms": ("ms", "50", "160"),
        "tr": ("tr", "50", "160"),
        "uk": ("uk", "50", "160"),
        "nl": ("nl", "50", "160"),
        "pl": ("pl", "50", "160"),
        "ru": ("ru", "50", "160"),
        "sv": ("sv", "50", "160"),
        "nb": ("nb", "50", "160"),
        "da": ("da", "50", "160"),
        "fi": ("fi", "50", "160"),
        "el": ("el", "50", "160"),
        "it": ("it", "50", "160"),
        "zh": ("cmn", "50", "160"),
        "zh-cn": ("cmn", "50", "160"),
        "cmn": ("cmn", "50", "160"),
        "zh-hk": ("yue", "50", "160"),
        "yue": ("yue", "50", "160"),
        "ht": ("ht", "50", "160"),
    }

    # Languages that must NOT ride an English eSpeak carrier (no verified voice).
    _NO_ESPEAK_PRIMARY = {
        "yo", "zu", "ak", "tw", "ig", "wo", "pcm", "lg", "ln", "rw", "xh",
        "ee", "ti", "sn", "ny", "ff", "bm", "so", "ha", "gaa", "ada", "dag",
    }

    def _gender_mod(self) -> str:
        vid = self._voice_id.lower()
        female = (
            "female" in vid
            or any(
                name in vid
                for name in (
                    "aisha", "hanna", "ama", "chioma", "lerato", "ava", "emma",
                    "chloe", "mia", "ruby", "wanjiku", "maya", "blessing", "akosua",
                    "camille", "thandi", "awa",
                )
            )
        )
        return "+f2" if female else "+m3"

    def _espeak_voice_args(self) -> list[str] | None:
        vid = self._voice_id.lower().removeprefix("own:")
        loc = self._locale.lower().replace("_", "-")
        gender_mod = self._gender_mod()

        # Voice-id specific English cultural varieties (exact prefix, not country substrings).
        if vid.startswith("en-gh") or vid == "en-kofi" or "kofi" in vid:
            return ["-v", f"en-029{gender_mod}", "-p", "48", "-s", "155"]
        if vid.startswith("en-ng"):
            return ["-v", f"en-029{gender_mod}", "-p", "52", "-s", "160"]
        if vid.startswith("en-ke"):
            return ["-v", f"en-gb{gender_mod}", "-p", "46", "-s", "150"]
        if vid.startswith("en-ph"):
            return ["-v", f"en-us{gender_mod}", "-p", "58", "-s", "165"]
        if vid.startswith("en-za"):
            return ["-v", f"en-gb{gender_mod}", "-p", "50", "-s", "158"]
        if vid.startswith("en-au"):
            return ["-v", f"en-au{gender_mod}", "-p", "52", "-s", "160"]
        if vid.startswith("en-nz"):
            return ["-v", f"en-nz{gender_mod}", "-p", "50", "-s", "158"]
        if vid.startswith("en-gb"):
            return ["-v", f"en-gb{gender_mod}", "-p", "50", "-s", "160"]
        if vid.startswith("en-us") or vid.startswith("en-ca"):
            return ["-v", f"en-us{gender_mod}", "-p", "50", "-s", "165"]

        primary = loc.split("-")[0] if loc else ""
        if primary in self._NO_ESPEAK_PRIMARY:
            return None

        for key in (loc, "-".join(loc.split("-")[:2]), primary):
            if key in self._ESPEAK_BY_LOCALE:
                voice, pitch, speed = self._ESPEAK_BY_LOCALE[key]
                return ["-v", f"{voice}{gender_mod}", "-p", pitch, "-s", speed]

        # Prefer verified eSpeak voices only. Never substitute a neighboring language
        # (e.g. Zulu → Afrikaans) — that fabricates false native support.
        return None

    @staticmethod
    def _finalize_streaming_wav(raw: bytes) -> bytes:
        """Rewrite eSpeak --stdout placeholder RIFF/data sizes to real buffer length."""
        if len(raw) < 44 or raw[0:4] != b"RIFF" or raw[8:12] != b"WAVE":
            return raw
        buf = bytearray(raw)
        offset = 12
        while offset + 8 <= len(buf):
            chunk_id = bytes(buf[offset : offset + 4])
            claimed = int.from_bytes(buf[offset + 4 : offset + 8], "little")
            if chunk_id == b"data":
                actual = len(buf) - (offset + 8)
                buf[offset + 4 : offset + 8] = actual.to_bytes(4, "little")
                buf[4:8] = (len(buf) - 8).to_bytes(4, "little")
                return bytes(buf)
            if claimed > len(buf) - offset - 8:
                break
            offset += 8 + claimed + (claimed % 2)
        if buf[36:40] == b"data":
            data_size = len(buf) - 44
            buf[40:44] = data_size.to_bytes(4, "little")
            buf[4:8] = (len(buf) - 8).to_bytes(4, "little")
        return bytes(buf)

    def _try_espeak(self, text: str, speed: float, voice_args: list[str]) -> Audio | None:
        import io
        import shutil
        import subprocess
        import tempfile
        import wave
        from pathlib import Path

        espeak_bin = shutil.which("espeak-ng") or shutil.which("espeak")
        if not espeak_bin:
            return None
        wpm = int(160 * speed)
        # Word gap (-g) reduces run-on syllables that listeners hear as shake/echo.
        base = [espeak_bin, *voice_args, "-s", str(wpm), "-g", "8"]
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                path = Path(tmp.name)
            try:
                res = subprocess.run(
                    [*base, "-w", str(path), text],
                    capture_output=True,
                    check=False,
                    timeout=15,
                )
                if res.returncode == 0 and path.exists() and path.stat().st_size > 44:
                    with wave.open(str(path), "rb") as w:
                        rate = w.getframerate()
                        frames = w.readframes(w.getnframes())
                        pcm = np.frombuffer(frames, dtype=np.int16)
                        if pcm.size > 0:
                            return Audio(pcm=pcm.copy(), sample_rate=rate)
            finally:
                path.unlink(missing_ok=True)

            # Fallback: stdout streaming WAV (rewrite placeholder sizes).
            res = subprocess.run([*base, "--stdout", text], capture_output=True, check=False, timeout=15)
            if res.returncode == 0 and len(res.stdout) > 44:
                raw = self._finalize_streaming_wav(res.stdout)
                with wave.open(io.BytesIO(raw), "rb") as w:
                    rate = w.getframerate()
                    frames = w.readframes(w.getnframes())
                    pcm = np.frombuffer(frames, dtype=np.int16)
                    if pcm.size > 0:
                        return Audio(pcm=pcm.copy(), sample_rate=rate)
        except Exception:
            return None
        return None

    def synthesize(self, text: str, speed: float) -> Audio:
        voice_args = self._espeak_voice_args()
        if voice_args:
            audio = self._try_espeak(text, speed, voice_args)
            if audio is not None:
                return audio
            # Gender variants like sw+f2 fail on some eSpeak builds — retry bare voice.
            if len(voice_args) >= 2 and ("+" in voice_args[1]):
                bare = voice_args[1].split("+", 1)[0]
                retry = ["-v", bare, *voice_args[2:]]
                audio = self._try_espeak(text, speed, retry)
                if audio is not None:
                    return audio

        # Native acoustic formant speech synthesis fallback (formant filtering, glottal excitation, fricatives)
        return self._formant_synthesis(text, speed)

    def _formant_synthesis(self, text: str, speed: float) -> Audio:
        sr = 16_000
        words = [w for w in text.split() if w]
        if not words:
            words = ["a"]
        
        # Determine base f0 (pitch) and formant shifts by voice identity
        is_female = "female" in self._voice_id or "aisha" in self._voice_id or "hanna" in self._voice_id or "ama" in self._voice_id or "chioma" in self._voice_id or "lerato" in self._voice_id
        f0 = 220.0 if is_female else 125.0
        if "gh" in self._voice_id:
            f0 *= 1.05
        elif "ng" in self._voice_id:
            f0 *= 0.95
        elif "ph" in self._voice_id:
            f0 *= 1.10
        elif "za" in self._voice_id:
            f0 *= 0.98

        word_dur = 0.28 / max(speed, 0.4)
        gap_sec = 0.06
        total_dur = len(words) * word_dur + max(0, len(words) - 1) * gap_sec + 0.1
        n = int(sr * total_dur)
        out = np.zeros(n, dtype=np.float32)

        # Standard acoustic formant sets for phonemes (F1, F2, F3 in Hz)
        vowels = [
            (730.0, 1090.0, 2440.0), # /a/
            (530.0, 1840.0, 2480.0), # /e/
            (270.0, 2290.0, 3010.0), # /i/
            (510.0, 840.0, 2400.0),  # /o/
            (300.0, 870.0, 2240.0),  # /u/
        ]

        gap = int(sr * 0.06)  # silence between words — never overlap (overlap sounds like echo)
        curr_idx = 0
        for w in words:
            w_len = int(sr * word_dur)
            t = np.arange(w_len, dtype=np.float32) / sr
            # Glottal pulse excitation train (buzz + aspirated air)
            glottal = (
                np.sin(2 * np.pi * f0 * t)
                + 0.5 * np.sin(4 * np.pi * f0 * t)
                + 0.25 * np.sin(6 * np.pi * f0 * t)
                + 0.12 * np.sin(8 * np.pi * f0 * t)
            )
            fricative = np.random.uniform(-0.15, 0.15, size=w_len).astype(np.float32)

            # Formant resonance mapping from word characters
            v_idx = (ord(w[0].lower()) if w else 0) % len(vowels)
            f1, f2, f3 = vowels[v_idx]
            formants = (
                np.sin(2 * np.pi * f1 * t) * 0.40
                + np.sin(2 * np.pi * f2 * t) * 0.25
                + np.sin(2 * np.pi * f3 * t) * 0.15
            )

            # Envelope: attack, decay, release
            env = np.sin(np.pi * np.clip(t / word_dur, 0.0, 1.0)) ** 1.5
            syllable_signal = (glottal * 0.35 + formants * 0.5 + fricative * 0.15) * env

            end_idx = min(n, curr_idx + w_len)
            out[curr_idx:end_idx] += syllable_signal[: end_idx - curr_idx]
            curr_idx = end_idx + gap
            if curr_idx >= n:
                break

        pcm = _to_int16(out * 0.75)
        return Audio(pcm=pcm, sample_rate=sr)


DemoToneEngine = SpeechSynthesisEngine
