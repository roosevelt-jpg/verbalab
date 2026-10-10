from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Optional


class LugemiError(Exception):
    def __init__(self, message: str, code: str = "http_error", status: int = 0):
        super().__init__(message)
        self.code = code
        self.status = status


class Lugemi:
    """First-party Lugemi API client stub (translate, speech, platform connectors)."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
    ) -> None:
        key = api_key or os.environ.get("LUGEMI_API_KEY", "")
        if not (
            key.startswith("lg_live_")
            or key.startswith("lg_test_")
            or key.startswith("vl_live_")
            or key.startswith("vl_test_")
        ):
            raise ValueError(
                "api_key must start with lg_live_ or lg_test_ (legacy vl_* accepted)"
            )
        self.api_key = key
        self.base_url = (
            base_url or os.environ.get("LUGEMI_BASE_URL") or "https://api.lugemi.com"
        ).rstrip("/")

    def _request_json(
        self, method: str, path: str, body: Optional[dict[str, Any]] = None
    ) -> Any:
        data = None if body is None else json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}{path}",
            data=data,
            method=method,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req) as res:
                raw = res.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as exc:
            payload = exc.read().decode("utf-8")
            try:
                err = json.loads(payload)
                message = err.get("error", {}).get("message") or payload
                code = err.get("error", {}).get("code") or "http_error"
            except Exception:
                message, code = payload or str(exc), "http_error"
            raise LugemiError(message, code=code, status=exc.code) from exc

    def _request_bytes(self, path: str, body: dict[str, Any]) -> bytes:
        data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}{path}",
            data=data,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "*/*",
            },
        )
        with urllib.request.urlopen(req) as res:
            return res.read()

    def translate(self, text: str, source: str, target: str) -> Any:
        return self._request_json(
            "POST",
            "/v1/translate",
            {"text": text, "source": source, "target": target},
        )

    def speech(self, text: str, voice: str = "own:ak-gh-female", **extra: Any) -> bytes:
        """POST /v1/audio/speech — returns raw audio bytes."""
        return self._request_bytes("/v1/audio/speech", {"text": text, "voice": voice, **extra})

    def tts_synthesize(
        self, text: str, voice: str = "own:ak-gh-female", **extra: Any
    ) -> bytes:
        """POST /v1/tts/synthesize — first-party TTS."""
        return self._request_bytes(
            "/v1/tts/synthesize", {"text": text, "voice": voice, **extra}
        )

    def list_voice_clones(self) -> Any:
        return self._request_json("GET", "/v1/voice-clones")

    def platform_connectors(self, category: Optional[str] = None) -> Any:
        path = "/v1/connectors/platform"
        if category:
            path = f"{path}?category={category}"
        return self._request_json("GET", path)

    def platform_connector(self, connector_id: str) -> Any:
        return self._request_json("GET", f"/v1/connectors/platform/{connector_id}")

    def platform_connector_demo(
        self,
        connector_id: str,
        text: str = "Hello",
        source: str = "en",
        target: str = "ak",
    ) -> Any:
        return self._request_json(
            "POST",
            f"/v1/connectors/platform/{connector_id}/demo",
            {"text": text, "source": source, "target": target},
        )
