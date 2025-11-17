# Memoa

Prototype of the Memoa UI with a Python + SQLite backend for persisting users
and notes.

## Getting started

### 1. Backend (Flask + SQLite)

```bash
cd /Users/gabriela/Documents/Memoa/server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

This launches the API on `http://127.0.0.1:5000`.

### 2. Frontend (static pages)

Open the HTML files in `/Users/gabriela/Documents/Memoa/html` with a live
server (for example using VS Code “Live Server”) so that fetch requests work as
expected.

## API

- `POST /api/register` – body `{ name, email, password }`
- `POST /api/login` – body `{ email, password }`
- `GET /api/notes?userId=ID`
- `POST /api/notes` – body `{ userId, content }`
- `DELETE /api/notes/:noteId`