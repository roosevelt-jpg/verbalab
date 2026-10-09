"""Publish a trained voice to the Lugemi speech engine after native-speaker review.

    python publish_voice.py --voice-id en-au-female --model runs/en-au-female/en-au-female.onnx \
        --name "Mia · Australia" --locale en-AU --gender female \
        --approved-by "Jane Citizen, native reviewer (Melbourne)" --notes "MOS 4.4 / 20 sentences"

Uploads <id>.onnx, <id>.onnx.json and <id>.lugemi.json to the voice bucket (tts-voices/),
then asks the engine to reload. The engine refuses any voice without an approval record.
`--voice-id` must match the catalog id in apps/api/src/gateway/own-tts.adapter.ts without `own:`.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--voice-id", required=True)
    parser.add_argument("--model", required=True, type=Path, help="exported .onnx (its .onnx.json must sit beside it)")
    parser.add_argument("--name", required=True)
    parser.add_argument("--locale", required=True, help="e.g. en-AU, ak-GH")
    parser.add_argument("--gender", required=True, choices=["female", "male", "neutral"])
    parser.add_argument("--approved-by", required=True, help="native-speaker reviewer who signed off the voice")
    parser.add_argument("--notes", default="", help="review evidence, e.g. MOS score and sentence count")
    parser.add_argument("--speaker", default="", help="voice-data speaker id the voice was trained on")
    parser.add_argument("--engine-url", default=os.environ.get("TTS_ENGINE_URL", ""), help="e.g. http://localhost:18080 via fly proxy")
    args = parser.parse_args()

    config = args.model.with_name(f"{args.model.name}.json")
    if not args.model.exists() or not config.exists():
        sys.exit(f"need both {args.model} and {config}")
    if not args.approved_by.strip():
        sys.exit("a native-speaker reviewer must approve the voice before it is published")

    meta = {
        "name": args.name,
        "locale": args.locale,
        "gender": args.gender,
        "approved": True,
        "approvedBy": args.approved_by.strip(),
        "approvedAt": datetime.now(timezone.utc).isoformat(),
        "reviewNotes": args.notes,
        "trainedOnSpeaker": args.speaker,
    }

    bucket = (os.environ.get("VOICE_MODELS_BUCKET") or os.environ.get("BUCKET_NAME") or "").strip()
    if not bucket:
        sys.exit("set VOICE_MODELS_BUCKET (or BUCKET_NAME) and AWS_* credentials")
    import boto3

    prefix = os.environ.get("VOICE_MODELS_PREFIX", "tts-voices/")
    s3 = boto3.client(
        "s3",
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL_S3") or None,
        region_name=os.environ.get("AWS_REGION", "auto"),
    )
    s3.upload_file(str(args.model), bucket, f"{prefix}{args.voice_id}.onnx")
    s3.upload_file(str(config), bucket, f"{prefix}{args.voice_id}.onnx.json")
    s3.put_object(
        Bucket=bucket,
        Key=f"{prefix}{args.voice_id}.lugemi.json",
        Body=json.dumps(meta, indent=2).encode("utf-8"),
        ContentType="application/json",
    )
    print(f"uploaded {args.voice_id} to s3://{bucket}/{prefix}")

    if args.engine_url:
        request = urllib.request.Request(f"{args.engine_url.rstrip('/')}/admin/reload", method="POST")
        key = os.environ.get("TTS_API_KEY", "").strip()
        if key:
            request.add_header("Authorization", f"Bearer {key}")
        with urllib.request.urlopen(request, timeout=300) as res:
            print(res.read().decode("utf-8"))
    else:
        print("engine not reloaded: pass --engine-url, or restart lugemi-tts to pick the voice up")


if __name__ == "__main__":
    main()
