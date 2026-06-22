# Zintellect AI — Prior Authorization Platform

AI-powered healthcare prior-authorization system with a React frontend and FastAPI backend.

## Stack

- **Frontend:** React 19 + Vite, Tailwind CSS v4, React Router v7, Lucide icons
- **Backend:** FastAPI, SQLAlchemy, SQLite, bcrypt/JWT auth
- **AI:** Ollama, LangChain, Sentence Transformers, ChromaDB

## Quick Start

### Backend

```bash
cd backend
venv\Scripts\activate     # or: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API runs at `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

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

Default credentials: `admin@zintellect.com` / `admin123`

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://127.0.0.1:8000` | Backend API URL (frontend `.env`) |
| `SECRET_KEY` | `zintellect_secret_key` | JWT signing key |

## Architecture Notes

- **Auth:** Unified `User` table with role column (Doctor/Provider/Patient/Admin). JWT tokens stored in `localStorage`.
- **Policies:** Insurance policies default to `pending` status. Admin must approve before they are visible to providers/doctors.
- **Dark Mode:** Toggle in AdminLayout sidebar. Preference persisted in `localStorage`.
- **Notifications:** `AdminNotifications` component polls `/admin/events` every 30s.
- **Audit:** All admin actions are logged to the `audit_logs` table.
