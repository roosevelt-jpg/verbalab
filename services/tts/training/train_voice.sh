#!/usr/bin/env bash
# Fine-tune one Lugemi voice (VITS, Piper trainer) on an exported native-speaker dataset.
# Run on a GPU machine. Usage:
#   ./train_voice.sh <voice-id> <dataset dir from export_dataset.py> <espeak voice> <base checkpoint .ckpt>
# Example:
#   ./train_voice.sh en-au-female data/en-au-female en-gb base/en-libritts_r-medium.ckpt
set -euo pipefail

VOICE_ID="$1"
DATASET="$2"
ESPEAK_VOICE="$3"
BASE_CKPT="$4"
RUN_DIR="runs/${VOICE_ID}"
mkdir -p "${RUN_DIR}"

python3 -m piper.train fit \
  --data.voice_name "${VOICE_ID}" \
  --data.csv_path "${DATASET}/metadata.csv" \
  --data.audio_dir "${DATASET}/wavs/" \
  --model.sample_rate 22050 \
  --data.espeak_voice "${ESPEAK_VOICE}" \
  --data.cache_dir "${RUN_DIR}/cache/" \
  --data.config_path "${RUN_DIR}/${VOICE_ID}.onnx.json" \
  --data.batch_size "${BATCH_SIZE:-32}" \
  --trainer.max_epochs "${MAX_EPOCHS:-3000}" \
  --trainer.default_root_dir "${RUN_DIR}" \
  --ckpt_path "${BASE_CKPT}"

LAST_CKPT="$(ls -t "${RUN_DIR}"/lightning_logs/version_*/checkpoints/*.ckpt | head -n 1)"
python3 -m piper.train.export_onnx \
  --checkpoint "${LAST_CKPT}" \
  --output-file "${RUN_DIR}/${VOICE_ID}.onnx"

REVIEW_FILE="${REVIEW_SENTENCES:-review_sentences.txt}"
if [ ! -f "${REVIEW_FILE}" ]; then
  echo "Write 20 held-out sentences (not in the training set) to ${REVIEW_FILE} for native review." >&2
  exit 1
fi
mkdir -p "${RUN_DIR}/review"
n=0
while IFS= read -r line; do
  [ -z "${line}" ] && continue
  n=$((n + 1))
  echo "${line}" | python3 -m piper -m "${RUN_DIR}/${VOICE_ID}.onnx" -f "${RUN_DIR}/review/${n}.wav"
done < "${REVIEW_FILE}"

echo "Exported ${RUN_DIR}/${VOICE_ID}.onnx"
echo "Send ${RUN_DIR}/review/*.wav to a native reviewer; publish only after they approve (publish_voice.py)."
