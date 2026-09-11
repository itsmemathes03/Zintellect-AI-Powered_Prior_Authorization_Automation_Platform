# Zintellect AI — Prior Authorization Platform

AI-powered healthcare prior-authorization system with a React frontend and FastAPI backend.

## Stack

- **Frontend:** React 19 + Vite, Tailwind CSS v4, React Router v7, Lucide icons
- **Backend:** FastAPI, SQLAlchemy, SQLite, bcrypt/JWT auth
- **AI:** Ollama, LangChain, Sentence Transformers, ChromaDB

## Running Without Docker

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com/download) (for AI decision-making)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env  # then fill in your values (see Environment Variables below)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify: Open http://localhost:8000/docs — Swagger UI should load.

### 2. Ollama Setup

```bash
ollama serve
ollama pull qwen2.5:1.5b-instruct
ollama list
curl http://localhost:11434/api/tags
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Verify: Open http://localhost:5173 — React app should load.

### 4. Environment Variables

Set these in `backend/.env` (copy from `.env.example`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | **Yes** | — | JWT signing key. Generate with `python -c "import secrets; print(secrets.token_urlsafe(64))"`. The app will refuse to start without it. |
| `EMAIL_ADDRESS` | No | — | Gmail address for sending notifications. App works without it (degrades gracefully). |
| `EMAIL_PASSWORD` | No | — | Gmail app password. Generate at https://myaccount.google.com/apppasswords. |
| `CHROMA_DB_PATH` | No | `app/vector_db/chroma` | Path where ChromaDB stores vector embeddings. |
| `OLLAMA_MODEL` | No | `qwen2.5:1.5b-instruct` | Ollama model used for AI-powered clinical decisions. |
| `OLLAMA_HOST` | No | `http://localhost:11434` | Ollama server URL. Change if running remotely. |
| `OLLAMA_TIMEOUT` | No | `120` | Seconds before an Ollama inference request times out. |
| `SENTRY_DSN` | No | — | Sentry DSN for error tracking. Leave blank to disable. |
| `APP_ENV` | No | `development` | Environment tag (`development` or `production`). |

### 5. Seed Admin User

```bash
cd backend
python seed_admin.py --auto
```

### 6. Seed Demo Accounts (All Portals)

Creates the login accounts for every portal (idempotent, safe to re-run):

```bash
cd backend
python seed_demo_credentials.py
```

## Demo Login Credentials

| Portal | Email | Password | Login URL |
|--------|-------|----------|-----------|
| Doctor | `doctor@gmail.com` | `doctor123` | `/doctor-login` |
| Patient | `patient@gmail.com` | `patient123` | `/patient-login` |
| Provider | `provider@gmail.com` | `provider123` | `/provider-login` |
| Admin | `admin@gmail.com` | `admin123` | `/admin-login` |

## Quick Start (Docker)

```bash
# TODO: Add Docker Compose instructions
```

## Admin Panel

### Endpoints (backend `/admin` routes)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/login` | Admin login |
| GET | `/admin/users` | List users (role/search/pagination) |
| POST | `/admin/users` | Create user |
| PUT | `/admin/users/{id}` | Update user |
| DELETE | `/admin/users/{id}` | Soft-deactivate user |
| GET | `/admin/policies` | List policies (status/search/pagination) |
| PATCH | `/admin/policies/{id}` | Approve/reject policy |
| GET | `/admin/analytics` | Dashboard analytics |
| GET | `/admin/audit` | Audit log (paginated/searchable) |
| GET | `/admin/settings` | Get SLA settings |
| PATCH | `/admin/settings` | Update SLA settings |
| GET | `/admin/events` | Event polling (new events since timestamp) |
| POST | `/admin/forgot-password` | Request password reset |
| POST | `/admin/reset-password` | Reset password with token |

### Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin-login` | `AdminLogin` | Login page with forgot-password flow |
| `/admin-dashboard` | `AdminDashboard` | Live stats, charts, recent activity |
| `/admin/users` | `UserManagement` | CRUD users with role-specific fields |
| `/admin/policies` | `PolicyManagement` | Approve/reject insurance policies |
| `/admin/analytics` | `SystemAnalytics` | Charts, breakdowns, CSV export |
| `/admin/audit` | `AdminAudit` | Audit log with filters and export |
| `/admin/settings` | `AdminSettings` | SLA time configuration |

### First Admin User

After starting the backend, create the first admin:

```bash
cd backend
python seed_admin.py --auto
```

Default credentials: `admin@gmail.com` / `admin123`

See [Demo Login Credentials](#demo-login-credentials) for the doctor, patient, provider, and admin accounts.

### Frontend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://127.0.0.1:8000` | Backend API URL (set in `frontend/.env`) |

## Architecture Notes

- **Auth:** Unified `User` table with role column (Doctor/Provider/Patient/Admin). JWT tokens stored in `localStorage`.
- **Policies:** Insurance policies default to `pending` status. Admin must approve before they are visible to providers/doctors.
- **Dark Mode:** Toggle in AdminLayout sidebar. Preference persisted in `localStorage`.
- **Notifications:** `AdminNotifications` component polls `/admin/events` every 30s.
- **Audit:** All admin actions are logged to the `audit_logs` table.
