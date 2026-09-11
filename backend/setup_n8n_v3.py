"""Fix and test the n8n workflow with correct Code node syntax."""
import json, requests, time

s = requests.Session()
s.post('http://localhost:5678/rest/login', json={'emailOrLdapLoginId':'admin@zintellect.com','password':'Zintellect123!'})
token = s.cookies.get('n8n-auth')
H = {'Cookie': f'n8n-auth={token}'}

# Deactivate all existing
r = s.get('http://localhost:5678/rest/workflows', headers=H)
for wf in r.json().get('data', []):
    if wf.get('active'):
        s.post(f"http://localhost:5678/rest/workflows/{wf['id']}/deactivate",
               json={'versionId': wf['versionId']}, headers=H)
        print(f"Deactivated: {wf['id']}")

# FIXED: In n8n Code node v2, use $input.first().json to access data
# The webhook puts the JSON body directly as the item's json data
js_code = (
    "const d = $input.first().json;"
    "const s = d.status || 'unknown';"
    "const r = d.request_id || 'n/a';"
    "const p = d.provider_id || '';"
    "const c = d.confidence_score || 0;"
    "const m = d.missing_requirements || [];"
    "let t, a;"
    "if (s === 'Approved') { t = 'N8N_APPROVED'; a = 'n8n: Approved'; }"
    "else if (s === 'Pending Additional Information') { t = 'N8N_MISSING_INFO'; a = 'n8n: Pending info'; }"
    "else { t = 'N8N_DENIED'; a = 'n8n: ' + s; }"
    "const msg = 'PA ' + r + ' -> ' + s + ' (' + c + '%)' + (m.length ? '. Missing: ' + m.join(', ') : '');"
    "return [{"
    "  json: {"
    "    notif: { user_id: p, role: 'provider', notification_type: t, message: msg, request_id: r },"
    "    audit: { request_id: r, action: a, description: msg },"
    "    request_id: r,"
    "    status: s"
    "  }"
    "}];"
)

respond_js = (
    "const d = $input.first().json;"
    "return [{ json: { status: 'received', request_id: d.request_id, processed: true } }];"
)

wf = {
    "name": "Zintellect PA Events v3",
    "nodes": [
        {
            "parameters": {
                "httpMethod": "POST",
                "path": "zintellect-pa-events",
                "responseMode": "lastNode",
                "options": {}
            },
            "id": "wh1", "name": "Webhook",
            "type": "n8n-nodes-base.webhook", "typeVersion": 2,
            "position": [240, 300], "webhookId": "zintellect-pa-events"
        },
        {
            "parameters": {"jsCode": js_code},
            "id": "code1", "name": "Process Event",
            "type": "n8n-nodes-base.code", "typeVersion": 2,
            "position": [480, 300]
        },
        {
            "parameters": {
                "method": "POST",
                "url": "http://localhost:8000/internal/n8n/notifications",
                "sendBody": True,
                "specifyBody": "json",
                "jsonBody": "={{ JSON.stringify($json.notif) }}",
                "options": {}
            },
            "id": "http1", "name": "Notify",
            "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2,
            "position": [740, 200]
        },
        {
            "parameters": {
                "method": "POST",
                "url": "http://localhost:8000/internal/n8n/audit",
                "sendBody": True,
                "specifyBody": "json",
                "jsonBody": "={{ JSON.stringify($json.audit) }}",
                "options": {}
            },
            "id": "http2", "name": "Audit",
            "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2,
            "position": [740, 400]
        },
        {
            "parameters": {"jsCode": respond_js},
            "id": "code2", "name": "Respond",
            "type": "n8n-nodes-base.code", "typeVersion": 2,
            "position": [1000, 300]
        }
    ],
    "connections": {
        "Webhook": {"main": [[{"node": "Process Event", "type": "main", "index": 0}]]},
        "Process Event": {"main": [[
            {"node": "Notify", "type": "main", "index": 0},
            {"node": "Audit", "type": "main", "index": 0}
        ]]},
        "Notify": {"main": [[{"node": "Respond", "type": "main", "index": 0}]]},
        "Audit": {"main": [[{"node": "Respond", "type": "main", "index": 0}]]}
    },
    "settings": {"executionOrder": "v1"}
}

r = s.post('http://localhost:5678/rest/workflows', json=wf, headers=H)
result = r.json()
if 'data' not in result:
    print(f"Create failed: {json.dumps(result, indent=2)[:300]}")
    exit(1)
wf_id = result['data']['id']
vid = result['data']['versionId']
print(f"Created: {wf_id}")

r = s.post(f"http://localhost:5678/rest/workflows/{wf_id}/activate",
           json={"versionId": vid}, headers=H)
active = r.json().get('data', {}).get('active', False)
print(f"Active: {active}")

time.sleep(1)

# Test Approved
print("\n--- TEST: Approved ---")
test = {"event":"prior_authorization_decision","request_id":"test-001","status":"Approved","confidence_score":95.5,"insurance_provider":"Test","procedure_code":"70553","matched_conditions":["Neurological deficits"],"missing_requirements":[],"uploaded_document_types":["clinical_notes"],"processing_time_seconds":22.5,"provider_id":"test-pid","provider_name":"Test"}
r = requests.post('http://localhost:5678/webhook/zintellect-pa-events', json=test, timeout=15)
print(f"  Status: {r.status_code}")
print(f"  Body: {r.text[:300]}")

# Test Pending
print("\n--- TEST: Pending ---")
test['request_id'] = 'test-002'
test['status'] = 'Pending Additional Information'
test['missing_requirements'] = ['prior_imaging_report', 'neurological_exam_report']
r = requests.post('http://localhost:5678/webhook/zintellect-pa-events', json=test, timeout=15)
print(f"  Status: {r.status_code}")
print(f"  Body: {r.text[:300]}")

# Test Denied
print("\n--- TEST: Denied ---")
test['request_id'] = 'test-003'
test['status'] = 'Rejected'
r = requests.post('http://localhost:5678/webhook/zintellect-pa-events', json=test, timeout=15)
print(f"  Status: {r.status_code}")
print(f"  Body: {r.text[:300]}")

# Verify DB
import sys
sys.path.insert(0, '.')
from app.database.db import SessionLocal
from app.models.notification_model import Notification
from app.models.audit_log_model import AuditLog

db = SessionLocal()
notifs = db.query(Notification).filter(Notification.notification_type.like('N8N_%')).all()
audits = db.query(AuditLog).filter(AuditLog.action.like('n8n:%')).all()
db.close()

print(f"\n--- DB Verification ---")
print(f"N8N Notifications: {len(notifs)}")
for n in notifs:
    print(f"  [{n.notification_type}] {n.message[:80]}")
print(f"N8N Audit Events: {len(audits)}")
for a in audits:
    print(f"  [{a.action}] {a.description[:80]}")
