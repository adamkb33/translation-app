# Translation App

Offline-first English/Russian translation app.

## Structure

- `frontend/` - React Router UI.
- `backend/` - Local FastAPI translation API.

## Development

Frontend:

```bash
npm --prefix frontend install
npm run dev:frontend
```

Backend:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
npm run dev:backend
```

## Offline Model Preparation

Run once while online:

```bash
pip install -r backend/requirements-models.txt
bash backend/scripts/prepare_models.sh
```

This downloads and converts the OPUS-MT models into `backend/models/`. Runtime translation uses only local files.

## Docker Compose

After preparing `backend/models/`, run both services:

```bash
docker compose up --build
```

If your Docker install uses the standalone Compose binary:

```bash
docker-compose up --build
```

Frontend: `http://localhost:3000`

Backend: `http://localhost:8000`
