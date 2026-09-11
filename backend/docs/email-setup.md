# Zintellect Email Notification Setup

## Overview

Zintellect sends professional, branded HTML emails via Gmail SMTP for:
- PA request status updates (approved/denied/pending)
- SLA breach alerts (admin notifications)
- Welcome emails (new user registration)
- Document processing confirmations
- System error alerts (admin notifications)

Emails are sent asynchronously via BackgroundTasks — API responses are never blocked by email delivery.

## Gmail Setup

1. Use a dedicated Gmail account (not personal inbox)
2. Enable 2-Step Verification on the account
3. Go to Google Account > Security > App passwords
4. Generate an app password scoped to "Mail" / "Other (Custom name)"
5. Name it `zintellect-smtp`
6. Copy the 16-character password immediately (shown once)

## Environment Variables

Add to `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=notifications.zintellect@gmail.com
SMTP_APP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=Zintellect
SMTP_FROM_EMAIL=notifications.zintellect@gmail.com
```

Falls back to `EMAIL_ADDRESS`/`EMAIL_PASSWORD` if SMTP_* vars are not set.

**Required:** `SMTP_USERNAME` and `SMTP_APP_PASSWORD` (or `EMAIL_ADDRESS` and `EMAIL_PASSWORD`).

## Rate Limits

- Free Gmail: ~500 emails/day
- New/low-reputation accounts: ~100/day
- For production at scale, migrate to SendGrid, AWS SES, or Postmark

## Testing

### Run email tests
```bash
cd backend
python -m pytest tests/test_email_renderer.py tests/test_email_sender.py -v
```

### Send a test email via API
```bash
curl -X POST http://localhost:8000/admin/test-email \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@gmail.com", "template": "welcome.html"}'
```

## Templates

| Template | Trigger | Audience |
|---|---|---|
| `pa_status_update.html` | PA status change | Provider/requester |
| `sla_breach_alert.html` | SLA deadline breached | Admin |
| `welcome.html` | New user registration | New user |
| `document_processed.html` | OCR pipeline complete | Uploader |
| `admin_error_alert.html` | Pipeline error | Admin |

## Architecture

```
app/services/email/
  config.py       — EmailSettings (pydantic-settings)
  renderer.py     — Jinja2 template renderer
  schemas.py      — Pydantic context models
  client.py       — Async SMTP with tenacity retry (3 attempts)
  sender.py       — High-level send functions via BackgroundTasks
  templates/      — 6 Jinja2 HTML templates (base + 5 types)
```
