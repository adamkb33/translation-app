# Backend

Local API for offline English/Russian translation.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

## Prepare Models

Run this once on a machine with internet access:

```bash
pip install -r backend/requirements-models.txt
bash backend/scripts/prepare_models.sh
```

The converted models are written to `backend/models/`. Bundle that folder with the app for offline runtime.

## Run

```bash
uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```
