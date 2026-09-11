"""Create and activate the n8n PA workflow via API."""
import json, urllib.request, http.cookiejar

BASE = "http://localhost:5678"

# --- Login ---
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
opener.addheaders = [("Content-Type", "application/json")]

login = json.dumps({"emailOrLdapLoginId": "admin@zintellect.com", "password": "Zintellect123!"}).encode()
req = urllib.request.Request(f"{BASE}/rest/login", data=login, method="POST")
resp = opener.open(req)
print("Logged in to n8n")

# --- Create workflow ---
js_code = (
    "const b=$input.first().json.body||$input.first().json;"
    "const s=b.status||'unknown';"
    "const r=b.request_id||'n/a';"
    "const p=b.provider_id||'';"
    "const c=b.confidence_score||0;"
    "const m=b.missing_requirements||[];"
    "let t,a;"
    "if(s==='Approved'){t='N8N_APPROVED';a='n8n: Approved';}"
    "else if(s==='Pending Additional Information'){t='N8N_MISSING_INFO';a='n8n: Pending info';}"
    "else{t='N8N_DENIED';a='n8n: '+s;}"
    "const msg='PA '+r+' -> '+s+' ('+c+'%)'+(m.length?'. Missing: '+m.join(', '):'');"
    "return[{json:{"
    "notif:{user_id:p,role:'provider',notification_type:t,message:msg,request_id:r},"
    "audit:{request_id:r,action:a,description:msg},"
    "request_id:r,status:s}}];"
)

respond_js = "return[{json:{status:'received',request_id:$input.first().json.request_id,processed:true}}];"

workflow = {
    "name": "Zintellect PA Events",
    "nodes": [
        {"parameters": {"httpMethod": "POST", "path": "zintellect-pa-events", "responseMode": "lastNode", "options": {}},
         "id": "wh1", "name": "Webhook", "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [240, 300], "webhookId": "zintellect-pa-events"},
        {"parameters": {"jsCode": js_code},
         "id": "code1", "name": "Process Event", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [480, 300]},
        {"parameters": {"method": "POST", "url": "http://localhost:8000/internal/n8n/notifications", "sendBody": True, "specifyBody": "json", "jsonBody": "={{ JSON.stringify($json.notif) }}", "options": {}},
         "id": "http1", "name": "Notify", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [740, 200]},
        {"parameters": {"method": "POST", "url": "http://localhost:8000/internal/n8n/audit", "sendBody": True, "specifyBody": "json", "jsonBody": "={{ JSON.stringify($json.audit) }}", "options": {}},
         "id": "http2", "name": "Audit", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [740, 400]},
        {"parameters": {"jsCode": respond_js},
         "id": "code2", "name": "Respond", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [1000, 300]},
    ],
    "connections": {
        "Webhook": {"main": [[{"node": "Process Event", "type": "main", "index": 0}]]},
        "Process Event": {"main": [[{"node": "Notify", "type": "main", "index": 0}, {"node": "Audit", "type": "main", "index": 0}]]},
        "Notify": {"main": [[{"node": "Respond", "type": "main", "index": 0}]]},
        "Audit": {"main": [[{"node": "Respond", "type": "main", "index": 0}]]},
    },
    "settings": {"executionOrder": "v1"},
}

wf_data = json.dumps(workflow).encode()
req = urllib.request.Request(f"{BASE}/rest/workflows", data=wf_data, method="POST")
resp = opener.open(req)
result = json.loads(resp.read())
wf_id = result["data"]["id"]
vid = result["data"]["versionId"]
print(f"Created workflow: {wf_id}")

# --- Activate ---
act_data = json.dumps({"versionId": vid}).encode()
req = urllib.request.Request(f"{BASE}/rest/workflows/{wf_id}/activate", data=act_data, method="POST")
resp = opener.open(req)
act_result = json.loads(resp.read())
print(f"Active: {act_result['data']['active']}")

# --- Test webhook ---
test_payload = json.dumps({
    "event": "prior_authorization_decision",
    "request_id": "test-direct-001",
    "status": "Approved",
    "confidence_score": 95.5,
    "insurance_provider": "Test Insurance",
    "procedure_code": "70553",
    "matched_conditions": ["Neurological deficits"],
    "missing_requirements": [],
    "uploaded_document_types": ["clinical_notes", "lab_results"],
    "processing_time_seconds": 22.5,
    "provider_id": "test-provider-id",
    "provider_name": "Test Provider",
}).encode()
req = urllib.request.Request(f"{BASE}/webhook/zintellect-pa-events", data=test_payload, method="POST")
req.add_header("Content-Type", "application/json")
try:
    resp = opener.open(req, timeout=15)
    body = resp.read().decode()
    print(f"Webhook response ({resp.status}): {body[:300]}")
except Exception as e:
    print(f"Webhook error: {e}")

print("\nDone!")
