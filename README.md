# 🏥 Zintellect – AI‑Powered Prior Authorization Automation Platform

## Overview

Zintellect is an end‑to‑end Prior Authorization (PA) automation platform for healthcare providers. It ingests medical PDFs and text files, extracts structured clinical information with an LLM (Ollama), reconciles the data against insurer‑specific policy rules, and returns an actionable decision (`Approved`, `Rejected`, or `Manual Review`) with a confidence score.

### Key Features
- **Document Upload** – Accepts PDF and TXT files (up to 5 MB).
- **PHI De‑identification** – Automatic masking of protected health information.
- **AI‑powered Extraction** – Uses Ollama `qwen2.5:1.5b` model to extract diagnosis, symptoms, medications, and requested procedures.
- **Policy Matching** – Loads insurer policies from SQLite and evaluates compliance.
- **Live Processing Tracker** – Shows each processing stage in the UI.
- **Request History** – Stores all submissions with status and extracted entities.
- **Dockerized Deployment** – Backend and frontend run in isolated containers for easy setup.

---

## Quick Start

### Prerequisites
- **Docker & Docker‑Compose** (>= 20.10)
- **Ollama server** (default `http://localhost:11434`). Install from https://ollama.com/.
- (Optional) **Python 3.11** and **Node.js 18+** if you prefer local development without Docker.

### Option 1 – Docker Compose (recommended)
```bash
# Clone the repo
git clone https://github.com/Zintellect/Zintellect.git
cd Zintellect

# Build and start services
docker-compose up --build -d
```
- Backend API: `http://localhost:8000`
- Frontend UI: `http://localhost:5173`

### Option 2 – Run Backend Locally
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Option 3 – Run Frontend Locally
```bash
cd frontend
npm install
npm run dev   # Vite dev server on http://localhost:5173
```

> The frontend expects the backend at `http://localhost:8000`. Change the proxy in `frontend/vite.config.js` if needed.

---

## Configuration & Environment Variables
Create a `.env` file in the project root (or inside `backend/`):
```dotenv
# Ollama endpoint (default)
OLLAMA_BASE_URL=http://localhost:11434

# JWT secret used for provider authentication
JWT_SECRET=your‑super‑secret‑key

# Debug flag (optional)
DEBUG=True
```
The backend reads these values via `os.getenv()`.

---

## Database
- SQLite file `backend/app/zintellect.db` is created automatically on first run (`Base.metadata.create_all`).
- Delete the file to reset the database.
- For production you can switch to PostgreSQL by updating `DATABASE_URL` in `backend/app/database/db.py`.

---

## API Reference
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/submit-request` | Submit a Prior Auth request with patient info and uploaded files. Returns a request ID and initial status. |
| `GET` | `/request-status/{request_id}` | Get current processing stage and final decision for a request. |
| `GET` | `/all-requests` | List all prior‑auth requests (admin view). |
| `POST` | `/provider/register` | Register a new insurance provider (email + password). Returns JWT. |
| `POST` | `/provider/login` | Provider login – returns JWT. |

*Full endpoint definitions are in `backend/app/routes/`.*

---

## Frontend Usage
- **Home** – Overview and navigation.
- **Provider Login / Register** – Authentication via JWT stored in `localStorage`.
- **Doctor Dashboard** – Upload documents, view live processing tracker, see extracted entities.
- **Request History** – Browse past submissions with status indicators (green = Approved, red = Rejected, orange = Manual Review).

> Add screenshots in `docs/screenshots/` and reference them with `![Dashboard](/docs/screenshots/dashboard.png)`.

---

## Project Structure
```
Zintellect/
├─ backend/                # FastAPI service
│   ├─ app/
│   │   ├─ models/         # SQLAlchemy models
│   │   ├─ routes/         # API endpoints
│   │   ├─ services/      # PHI masking, AI extraction, policy matching
│   │   └─ database/       # SQLite engine
│   ├─ Dockerfile
│   └─ requirements.txt
├─ frontend/               # React + Vite UI
│   ├─ src/
│   │   ├─ components/    # Reusable UI components
│   │   ├─ pages/         # Dashboard, Request form, History, etc.
│   │   └─ api/           # Axios wrappers for backend endpoints
│   ├─ Dockerfile
│   └─ package.json
├─ docker-compose.yml      # Multi‑container orchestration
└─ README.md               # This file
```

---

## Testing
```bash
# Backend tests
cd backend
pytest
```
```bash
# Frontend lint / type checks
cd frontend
npm run lint
```

---

## Linting & Formatting
- **Backend** – add `ruff` or `flake8` (`ruff .`).
- **Frontend** – already set up with ESLint (`npm run lint`) and can use Prettier (`npm run format`).

---

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/awesome-feature`).
3. Install development dependencies.
4. Write tests and ensure the full test suite passes.
5. Open a Pull Request referencing an issue.

*Consider adding a `CODE_OF_CONDUCT.md` and using Conventional Commits for a clean changelog.*

---

## License
MIT © Zintellect

---

## Acknowledgements & References
- **FastAPI** – https://fastapi.tiangolo.com/
- **Ollama** – https://ollama.com/ (model `qwen2.5:1.5b`)
- **React** – https://react.dev/
- **Vite** – https://vitejs.dev/
- **TailwindCSS** – https://tailwindcss.com/
- **SQLAlchemy** – https://www.sqlalchemy.org/
- **Docker** – https://docs.docker.com/
