import { useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "./+types/home";

type Direction = "en-ru" | "ru-en";
type Status = "idle" | "checking" | "ready" | "missing" | "error";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

const languages: Record<Direction, { source: string; target: string }> = {
  "en-ru": {
    source: "English",
    target: "Russian",
  },
  "ru-en": {
    source: "Russian",
    target: "English",
  },
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Offline English Russian Translator" },
    {
      name: "description",
      content: "Local English and Russian translation",
    },
  ];
}

export default function Home() {
  const [direction, setDirection] = useState<Direction>("en-ru");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [availableDirections, setAvailableDirections] = useState<Direction[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const latestRequestId = useRef(0);

  const currentLanguages = languages[direction];
  const canTranslate = sourceText.trim().length > 0 && !isTranslating;

  const statusLabel = useMemo(() => {
    if (status === "checking") return "Checking local engine";
    if (status === "ready") return "Offline engine ready";
    if (status === "missing") return "Offline models missing";
    if (status === "error") return "Backend unavailable";
    return "Local translation";
  }, [status]);

  useEffect(() => {
    let ignore = false;

    async function checkBackend() {
      setStatus("checking");
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const data = (await response.json()) as {
          available_directions?: Direction[];
        };
        const directions = data.available_directions ?? [];

        if (ignore) return;

        setAvailableDirections(directions);
        setStatus(directions.length > 0 ? "ready" : "missing");
      } catch (error) {
        if (ignore) return;
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Could not reach backend",
        );
      }
    }

    checkBackend();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const text = sourceText.trim();

    if (!text) {
      latestRequestId.current += 1;
      setTranslatedText("");
      setMessage("");
      setIsTranslating(false);
      return;
    }

    if (status !== "ready") return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      translate(text, direction, controller.signal);
    }, 450);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [direction, sourceText, status]);

  async function translate(
    text = sourceText.trim(),
    selectedDirection = direction,
    signal?: AbortSignal,
  ) {
    if (!text) return;

    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;
    setIsTranslating(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal,
        body: JSON.stringify({
          text,
          direction: selectedDirection,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? `Translation failed: ${response.status}`);
      }

      if (latestRequestId.current === requestId) {
        setTranslatedText(data.translated_text ?? "");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (latestRequestId.current === requestId) {
        setTranslatedText("");
        setMessage(error instanceof Error ? error.message : "Translation failed");
      }
    } finally {
      if (latestRequestId.current === requestId) {
        setIsTranslating(false);
      }
    }
  }

  function swapDirection() {
    setDirection((current) => (current === "en-ru" ? "ru-en" : "en-ru"));
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  }

  return (
    <main className="translator-shell">
      <section className="translator-header">
        <div>
          <p className="eyebrow">Offline translator</p>
          <h1>English Russian Translation</h1>
        </div>
        <div className={`status-pill status-${status}`}>
          <span />
          {statusLabel}
        </div>
      </section>

      <section className="translator-workspace" aria-label="Translation">
        <div className="language-bar">
          <button
            className={direction === "en-ru" ? "language-tab active" : "language-tab"}
            type="button"
            onClick={() => setDirection("en-ru")}
          >
            English to Russian
          </button>
          <button
            className={direction === "ru-en" ? "language-tab active" : "language-tab"}
            type="button"
            onClick={() => setDirection("ru-en")}
          >
            Russian to English
          </button>
          <button className="swap-button" type="button" onClick={swapDirection}>
            Swap
          </button>
        </div>

        <div className="translation-grid">
          <label className="translation-panel">
            <span className="panel-label">{currentLanguages.source}</span>
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder={
                direction === "en-ru"
                  ? "Type English text here"
                  : "Введите русский текст"
              }
              spellCheck={false}
            />
          </label>

          <div className="translation-panel output-panel">
            <span className="panel-label">{currentLanguages.target}</span>
            <div className="translation-output">
              {translatedText || (
                <span className="empty-output">Translation will appear here</span>
              )}
            </div>
          </div>
        </div>

        <div className="action-row">
          <div className="model-summary">
            {availableDirections.length > 0
              ? `Live translation active: ${availableDirections.join(", ")}`
              : "No local model loaded"}
          </div>
          <button
            className="translate-button"
            type="button"
            disabled={!canTranslate}
            onClick={() => translate()}
          >
            {isTranslating ? "Translating" : "Translate now"}
          </button>
        </div>

        {message ? <p className="error-message">{message}</p> : null}
      </section>
    </main>
  );
}
