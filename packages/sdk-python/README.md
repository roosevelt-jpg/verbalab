# Lugemi Python SDK (stub)

Thin first-party client stubs for platforms integrating Lugemi Language Intelligence
(translate, TTS, STT, voice clone refs, realtime segments, and Studio Connectors).

```bash
pip install -e packages/sdk-python
export LUGEMI_API_KEY=lg_test_...
export LUGEMI_BASE_URL=http://localhost:3001
```

```python
from lugemi import Lugemi

client = Lugemi(api_key="lg_test_...")
print(client.translate(text="Hello", source="en", target="ak"))
print(client.platform_connectors())
print(client.platform_connector("livekit"))
print(client.platform_connector_demo("africas-talking", text="Hello", target="ak"))
```

Not a wrapper around third-party voice vendors — Lugemi owns speech and dialect models.
