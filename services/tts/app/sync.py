"""Pull trained voice files from Lugemi's object storage (Fly Tigris) into MODELS_DIR."""

from __future__ import annotations

import logging
import os
from pathlib import Path

log = logging.getLogger("lugemi.tts.sync")

SUFFIXES = (".onnx", ".onnx.json", ".lugemi.json")


def bucket_name() -> str:
    return (os.environ.get("VOICE_MODELS_BUCKET") or os.environ.get("BUCKET_NAME") or "").strip()


def sync_models(models_dir: Path) -> int:
    bucket = bucket_name()
    if not bucket:
        return 0
    import boto3

    prefix = os.environ.get("VOICE_MODELS_PREFIX", "tts-voices/")
    client = boto3.client(
        "s3",
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL_S3") or None,
        region_name=os.environ.get("AWS_REGION", "auto"),
    )
    models_dir.mkdir(parents=True, exist_ok=True)
    fetched = 0
    paginator = client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            key: str = obj["Key"]
            name = key[len(prefix):]
            if "/" in name or not name.endswith(SUFFIXES):
                continue
            target = models_dir / name
            if target.exists() and target.stat().st_size == obj["Size"]:
                continue
            partial = target.with_name(f"{target.name}.part")
            client.download_file(bucket, key, str(partial))
            partial.replace(target)
            fetched += 1
            log.info("fetched %s", name)
    return fetched
