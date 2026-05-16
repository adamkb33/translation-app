from pathlib import Path

from transformers import AutoTokenizer


ROOT_DIR = Path(__file__).resolve().parents[2]
MODELS_DIR = ROOT_DIR / "backend" / "models"

TOKENIZERS = {
    "Helsinki-NLP/opus-mt-en-ru": MODELS_DIR / "opus-mt-en-ru-tokenizer",
    "Helsinki-NLP/opus-mt-ru-en": MODELS_DIR / "opus-mt-ru-en-tokenizer",
}


def main() -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    for model_name, output_dir in TOKENIZERS.items():
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        tokenizer.save_pretrained(output_dir)


if __name__ == "__main__":
    main()
