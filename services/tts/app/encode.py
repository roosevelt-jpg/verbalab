from __future__ import annotations

import io
import subprocess
import wave

from .engines import Audio

MIME = {
    "wav": "audio/wav",
    "mp3": "audio/mpeg",
    "opus": "audio/ogg",
    "aac": "audio/aac",
    "flac": "audio/flac",
}

_FFMPEG_ARGS = {
    "mp3": ["-f", "mp3", "-c:a", "libmp3lame", "-q:a", "2"],
    "opus": ["-f", "ogg", "-c:a", "libopus", "-b:a", "64k"],
    "aac": ["-f", "adts", "-c:a", "aac", "-b:a", "128k"],
    "flac": ["-f", "flac", "-c:a", "flac"],
}


def to_wav(audio: Audio) -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(audio.sample_rate)
        out.writeframes(audio.pcm.tobytes())
    return buffer.getvalue()


def encode(audio: Audio, fmt: str) -> bytes:
    if fmt == "wav":
        return to_wav(audio)
    args = _FFMPEG_ARGS[fmt]
    result = subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error",
            "-f", "s16le", "-ar", str(audio.sample_rate), "-ac", "1", "-i", "pipe:0",
            *args, "pipe:1",
        ],
        input=audio.pcm.tobytes(),
        capture_output=True,
        check=False,
        timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.decode("utf-8", "replace")[:300] or "ffmpeg failed")
    return result.stdout
