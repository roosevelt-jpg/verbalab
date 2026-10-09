"""Export one native speaker's approved recordings as a TTS training set (LJSpeech layout).

    fly proxy 15432:5432 -a lugemi-db            # in another terminal
    DATABASE_URL=postgres://...@localhost:15432/verbalab \
    VOICE_DATA_BUCKET=... AWS_ENDPOINT_URL_S3=... AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... \
    python export_dataset.py --dialect en-au --speaker <speaker id> --out data/en-au-female

Output: <out>/wavs/<recording id>.wav (22.05 kHz mono, loudness-normalised, silence-trimmed)
and <out>/metadata.csv (`id|text`). Withdrawn speakers and unapproved takes are never exported.
"""

from __future__ import annotations

import argparse
import csv
import os
import subprocess
import sys
from pathlib import Path

MIN_HOURS = 1.0
RECOMMENDED_HOURS = 3.0
SAMPLE_RATE = 22050


def fetch_rows(dialect: str, speaker_id: str) -> list[dict]:
    import psycopg

    with psycopg.connect(os.environ["DATABASE_URL"]) as conn, conn.cursor() as cur:
        cur.execute(
            """
            select s.id, s.withdrawn_at, s.consent_at
            from voice_data_speakers s where s.id = %s and s.dialect = %s
            """,
            (speaker_id, dialect),
        )
        speaker = cur.fetchone()
        if speaker is None:
            sys.exit(f"speaker {speaker_id} not found for dialect {dialect}")
        if speaker[1] is not None:
            sys.exit(f"speaker {speaker_id} has withdrawn consent; nothing may be exported")
        if speaker[2] is None:
            sys.exit(f"speaker {speaker_id} never gave consent; nothing may be exported")
        cur.execute(
            """
            select id, text, mime_type, duration_ms, storage_key, data
            from voice_data_recordings
            where speaker_id = %s and status = 'approved'
            order by created_at
            """,
            (speaker_id,),
        )
        columns = [c.name for c in cur.description]
        return [dict(zip(columns, row)) for row in cur.fetchall()]


def load_audio(row: dict, s3, bucket: str) -> bytes:
    if row["data"] is not None:
        return bytes(row["data"])
    if not row["storage_key"]:
        raise RuntimeError(f"recording {row['id']} has no audio")
    return s3.get_object(Bucket=bucket, Key=row["storage_key"])["Body"].read()


def to_training_wav(raw: bytes, target: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", "pipe:0",
            "-af",
            "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,"
            "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.25,areverse,"
            "loudnorm=I=-20:TP=-2:LRA=11",
            "-ac", "1", "-ar", str(SAMPLE_RATE), "-sample_fmt", "s16", str(target),
        ],
        input=raw,
        check=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dialect", required=True, help="voice-data dialect code, e.g. en-au, ak-gh-asante")
    parser.add_argument("--speaker", required=True, help="one speaker per voice")
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    rows = fetch_rows(args.dialect, args.speaker)
    if not rows:
        sys.exit("no approved recordings for this speaker yet")

    s3 = None
    bucket = (os.environ.get("VOICE_DATA_BUCKET") or os.environ.get("BUCKET_NAME") or "").strip()
    if any(r["data"] is None for r in rows):
        if not bucket:
            sys.exit("recordings live in object storage: set VOICE_DATA_BUCKET and AWS_* credentials")
        import boto3

        s3 = boto3.client(
            "s3",
            endpoint_url=os.environ.get("AWS_ENDPOINT_URL_S3") or None,
            region_name=os.environ.get("AWS_REGION", "auto"),
        )

    wavs = args.out / "wavs"
    wavs.mkdir(parents=True, exist_ok=True)
    total_ms = 0
    with open(args.out / "metadata.csv", "w", encoding="utf-8", newline="") as meta:
        writer = csv.writer(meta, delimiter="|", quoting=csv.QUOTE_NONE, escapechar="\\")
        for row in rows:
            text = " ".join(row["text"].split()).replace("|", " ")
            to_training_wav(load_audio(row, s3, bucket), wavs / f"{row['id']}.wav")
            writer.writerow([row["id"], text])
            total_ms += row["duration_ms"]

    hours = total_ms / 3_600_000
    print(f"exported {len(rows)} recordings, {hours:.2f} h -> {args.out}")
    if hours < MIN_HOURS:
        print(f"WARNING: below {MIN_HOURS:.0f} h; a voice trained on this will not sound native. Keep recording.")
    elif hours < RECOMMENDED_HOURS:
        print(f"NOTE: usable, but {RECOMMENDED_HOURS:.0f}+ h gives premium quality.")


if __name__ == "__main__":
    main()
