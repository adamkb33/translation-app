from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.translator import Direction, OfflineTranslator


app = FastAPI(title="Offline English Russian Translator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

translator = OfflineTranslator()


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1)
    direction: Direction = "en-ru"


class TranslateResponse(BaseModel):
    translated_text: str
    direction: Direction


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "available_directions": translator.available_directions(),
    }


@app.post("/translate", response_model=TranslateResponse)
def translate(request: TranslateRequest) -> TranslateResponse:
    try:
        translated_text = translator.translate(request.text, request.direction)
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    return TranslateResponse(
        translated_text=translated_text,
        direction=request.direction,
    )
