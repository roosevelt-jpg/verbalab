FROM python:3.11-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ARG KOKORO_RELEASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
RUN mkdir -p models/kokoro \
  && curl -fsSL -o models/kokoro/kokoro-v1.0.onnx "$KOKORO_RELEASE/kokoro-v1.0.onnx" \
  && curl -fsSL -o models/kokoro/voices-v1.0.bin "$KOKORO_RELEASE/voices-v1.0.bin"

COPY voices.json .
COPY app ./app

ENV MODELS_DIR=/data/voices \
    PYTHONUNBUFFERED=1

FROM base AS test
COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt
COPY tests ./tests
CMD ["python", "-m", "pytest", "-q", "tests"]

FROM base AS runtime
EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "::", "--port", "8080", "--workers", "1"]
