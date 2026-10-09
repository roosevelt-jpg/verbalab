import io
import json
import wave

import pytest
from fastapi.testclient import TestClient

from app import main
from app.registry import VoiceInfo, VoiceRegistry


@pytest.fixture(scope="module")
def client():
    with TestClient(main.app) as c:
        yield c


def wav_seconds(data: bytes) -> float:
    with wave.open(io.BytesIO(data)) as w:
        return w.getnframes() / w.getframerate()


def test_lists_built_in_english_voices(client):
    ids = {v["id"] for v in client.get("/voices").json()["voices"]}
    assert {"en-us-female", "en-us-male", "en-gb-female", "en-gb-male"} <= ids


@pytest.mark.parametrize("voice", ["en-us-female", "en-us-male", "en-gb-female", "en-gb-male"])
def test_speaks_real_audio(client, voice):
    res = client.post("/", json={"text": "Welcome to Lugemi. Your voice, your language.", "voice": voice, "format": "wav"})
    assert res.status_code == 200, res.text
    assert res.headers["content-type"] == "audio/wav"
    assert wav_seconds(res.content) > 1.0


@pytest.mark.parametrize("fmt,magic", [("mp3", (b"ID3", b"\xff\xf3", b"\xff\xfb", b"\xff\xf2")), ("opus", (b"OggS",)), ("flac", (b"fLaC",))])
def test_encodes_compressed_formats(client, fmt, magic):
    res = client.post("/synthesize", json={"text": "Good morning.", "voice": "en-gb-female", "format": fmt})
    assert res.status_code == 200, res.text
    assert res.content.startswith(magic)


def test_refuses_other_accent(client):
    res = client.post("/", json={"text": "G'day", "voice": "en-us-female", "language": "en-AU"})
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "native_voice_unavailable"


def test_refuses_other_language(client):
    res = client.post("/", json={"text": "Akwaaba", "voice": "en-gb-male", "language": "ak-GH"})
    assert res.status_code == 422


def test_unknown_voice_is_not_live(client):
    res = client.post("/", json={"text": "Akwaaba", "voice": "ak-gh-female"})
    assert res.status_code == 422


def test_requires_key_when_configured(client, monkeypatch):
    monkeypatch.setenv("TTS_API_KEY", "secret")
    assert client.get("/voices").status_code == 401
    assert client.get("/voices", headers={"Authorization": "Bearer secret"}).status_code == 200
    assert client.get("/health").status_code == 200


def test_language_matching():
    au = VoiceInfo(id="en-au-female", name="AU", locale="en-AU", gender="female", engine="piper")
    assert main.language_matches(au, "en")
    assert main.language_matches(au, "en-AU")
    assert not main.language_matches(au, "en-NZ")
    twi = VoiceInfo(id="ak-gh-female", name="Twi", locale="ak-GH", gender="female", engine="piper")
    assert main.language_matches(twi, "ak-gh-asante")
    assert not main.language_matches(twi, "ee-GH")


def test_trained_voice_needs_native_approval(tmp_path):
    for name in ("en-au-female.onnx", "en-au-female.onnx.json"):
        (tmp_path / name).write_bytes(b"{}")
    meta = tmp_path / "en-au-female.lugemi.json"
    meta.write_text(json.dumps({"name": "Mia", "locale": "en-AU", "gender": "female", "approved": False}))
    registry = VoiceRegistry(models_dir=tmp_path)
    registry.load()
    assert registry.get("en-au-female") is None

    meta.write_text(json.dumps({"name": "Mia", "locale": "en-AU", "gender": "female", "approved": True, "approvedBy": "Native reviewer, Sydney"}))
    registry.load()
    voice = registry.get("en-au-female")
    assert voice is not None and voice.engine == "piper" and voice.locale == "en-AU"


def test_trained_voice_needs_model_files(tmp_path):
    (tmp_path / "en-nz-male.lugemi.json").write_text(json.dumps({"approved": True, "approvedBy": "Reviewer"}))
    registry = VoiceRegistry(models_dir=tmp_path)
    registry.load()
    assert registry.get("en-nz-male") is None
