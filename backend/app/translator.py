from pathlib import Path
from typing import Literal

import ctranslate2
from transformers import AutoTokenizer


Direction = Literal["en-ru", "ru-en"]

BACKEND_DIR = Path(__file__).resolve().parents[1]
MODELS_DIR = BACKEND_DIR / "models"

MODEL_CONFIG = {
    "en-ru": {
        "ct2_path": MODELS_DIR / "opus-mt-en-ru-ct2",
        "tokenizer_path": MODELS_DIR / "opus-mt-en-ru-tokenizer",
    },
    "ru-en": {
        "ct2_path": MODELS_DIR / "opus-mt-ru-en-ct2",
        "tokenizer_path": MODELS_DIR / "opus-mt-ru-en-tokenizer",
    },
}


class OfflineTranslator:
    def __init__(self) -> None:
        self._translators: dict[Direction, ctranslate2.Translator] = {}
        self._tokenizers = {}

    def available_directions(self) -> list[Direction]:
        return [
            direction
            for direction, config in MODEL_CONFIG.items()
            if config["ct2_path"].exists()
        ]

    def translate(self, text: str, direction: Direction) -> str:
        translator = self._get_translator(direction)
        tokenizer = self._get_tokenizer(direction)

        source_tokens = tokenizer.convert_ids_to_tokens(tokenizer.encode(text))
        results = translator.translate_batch([source_tokens])
        target_tokens = results[0].hypotheses[0]

        return tokenizer.decode(
            tokenizer.convert_tokens_to_ids(target_tokens),
            skip_special_tokens=True,
        )

    def _get_translator(self, direction: Direction) -> ctranslate2.Translator:
        if direction not in MODEL_CONFIG:
            raise ValueError(f"Unsupported translation direction: {direction}")

        if direction not in self._translators:
            model_path = MODEL_CONFIG[direction]["ct2_path"]
            if not model_path.exists():
                raise FileNotFoundError(
                    f"Missing offline model at {model_path}. "
                    "Run the model preparation step on a machine with internet access first."
                )
            self._translators[direction] = ctranslate2.Translator(str(model_path))

        return self._translators[direction]

    def _get_tokenizer(self, direction: Direction):
        if direction not in self._tokenizers:
            tokenizer_path = MODEL_CONFIG[direction]["tokenizer_path"]
            if not tokenizer_path.exists():
                raise FileNotFoundError(
                    f"Missing offline tokenizer at {tokenizer_path}. "
                    "Run the model preparation step on a machine with internet access first."
                )
            self._tokenizers[direction] = AutoTokenizer.from_pretrained(
                tokenizer_path,
                local_files_only=True,
            )
        return self._tokenizers[direction]
