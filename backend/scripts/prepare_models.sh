#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MODELS_DIR="$ROOT_DIR/backend/models"

python - <<'PY'
try:
    import torch  # noqa: F401
except ImportError:
    raise SystemExit(
        "PyTorch is required for model conversion. "
        "Run: pip install -r backend/requirements-models.txt"
    )
PY

mkdir -p "$MODELS_DIR"

ct2-transformers-converter \
  --model Helsinki-NLP/opus-mt-en-ru \
  --output_dir "$MODELS_DIR/opus-mt-en-ru-ct2" \
  --quantization int8

ct2-transformers-converter \
  --model Helsinki-NLP/opus-mt-ru-en \
  --output_dir "$MODELS_DIR/opus-mt-ru-en-ct2" \
  --quantization int8

python "$ROOT_DIR/backend/scripts/prepare_tokenizers.py"
