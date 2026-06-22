import os
import smtplib

from email.mime.text import MIMEText

from email.mime.multipart import MIMEMultipart

# ==========================================
# GMAIL CONFIG
# ==========================================

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS", "itsmemathes@gmail.com")

EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "qbdb tgxk acmw cbkw")


# ==========================================
# SEND INSURANCE REGISTRATION EMAIL
# ==========================================


def send_insurance_email(
    patient_email, patient_name, insurance_id, provider_name, procedure_name
):

    try:
        subject = "Welcome to Zintellect - Insurance Registration Confirmed"

        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">

<!-- Subtle grid pattern overlay -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;background-image:radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px);background-size:20px 20px">
<tr><td align="center">

<!-- Main Card -->
<table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-radius:32px;overflow:hidden;box-shadow:0 32px 64px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.05)">

<!-- Animated Gradient Header -->
<tr>
<td style="position:relative;background:linear-gradient(135deg,#059669,#0d9488,#0891b2);padding:48px 40px 40px;text-align:center;overflow:hidden">
<div style="display:none;position:absolute;top:-60px;right:-60px;width:200px;height:200px;background:rgba(255,255,255,0.06);border-radius:50%"></div>
<div style="display:none;position:absolute;bottom:-40px;left:-40px;width:160px;height:160px;background:rgba(255,255,255,0.04);border-radius:50%"></div>

<!-- Logo Area -->
<table cellpadding="0" cellspacing="0" style="margin:0 auto 28px">
<tr>
<td style="width:64px;height:64px;background:rgba(255,255,255,0.12);border-radius:18px;text-align:center;vertical-align:middle;border:1px solid rgba(255,255,255,0.15)">
<span style="font-size:30px;line-height:64px">&#9830;</span>
</td>
</tr>
</table>

<h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:800;letter-spacing:-0.5px">Insurance Registration</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:16px;font-weight:400">Your coverage has been activated</p>

<!-- Status Badge -->
<table cellpadding="0" cellspacing="0" style="margin:24px auto 0;background:rgba(255,255,255,0.1);border-radius:100px;padding:8px 24px;border:1px solid rgba(255,255,255,0.12)">
<tr>
<td style="width:8px;height:8px;background:#34d399;border-radius:50%;display:inline-block;vertical-align:middle"></td>
<td style="padding-left:10px;color:#34d399;font-size:13px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">Active Coverage</td>
</tr>
</table>
</td>
</tr>

<!-- Body Section -->
<tr><td style="padding:40px">

<!-- Welcome Message -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:28px 32px">
<tr><td>
<p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.8">Dear <span style="color:#f1f5f9;font-weight:700">{patient_name}</span>,</p>
<p style="margin:16px 0 0;color:#94a3b8;font-size:14px;line-height:1.8">Your insurance registration has been completed successfully. You are now covered under <span style="color:#34d399;font-weight:600">{provider_name}</span>. Please find your membership details below.</p>
</td></tr>
</table>

<!-- Stats Grid -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
<tr>
<td width="50%" style="padding-right:12px;vertical-align:top">
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(5,150,105,0.08),rgba(5,150,105,0.02));border:1px solid rgba(5,150,105,0.15);border-radius:20px;padding:24px 20px">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" style="width:48px;height:48px;background:rgba(5,150,105,0.15);border-radius:14px;text-align:center;vertical-align:middle;margin:0 auto 12px">
<tr><td align="center" style="font-size:22px;color:#34d399;font-weight:700">&#9679;</td></tr>
</table>
<p style="margin:0;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Insurance ID</p>
<p style="margin:8px 0 0;color:#f1f5f9;font-size:20px;font-weight:800;letter-spacing:1px;font-family:'SF Mono','Fira Code','Courier New',monospace">{insurance_id}</p>
</td></tr>
</table>
</td>
<td width="50%" style="padding-left:12px;vertical-align:top">
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(168,85,247,0.08),rgba(168,85,247,0.02));border:1px solid rgba(168,85,247,0.15);border-radius:20px;padding:24px 20px">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" style="width:48px;height:48px;background:rgba(168,85,247,0.15);border-radius:14px;text-align:center;vertical-align:middle;margin:0 auto 12px">
<tr><td align="center" style="font-size:22px;color:#c084fc;font-weight:700">&#9679;</td></tr>
</table>
<p style="margin:0;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Provider</p>
<p style="margin:8px 0 0;color:#f1f5f9;font-size:16px;font-weight:700">{provider_name}</p>
</td></tr>
</table>
</td>
</tr>
</table>

<!-- Info Cards Row 2 -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">
<tr>
<td width="50%" style="padding-right:12px;vertical-align:top">
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(251,146,60,0.08),rgba(251,146,60,0.02));border:1px solid rgba(251,146,60,0.15);border-radius:20px;padding:20px">
<tr><td align="center">
<p style="margin:0;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Covered Procedure</p>
<p style="margin:8px 0 0;color:#f1f5f9;font-size:14px;font-weight:600">{procedure_name}</p>
</td></tr>
</table>
</td>
<td width="50%" style="padding-left:12px;vertical-align:top">
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(6,182,212,0.08),rgba(6,182,212,0.02));border:1px solid rgba(6,182,212,0.15);border-radius:20px;padding:20px">
<tr><td align="center">
<p style="margin:0;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Status</p>
<table cellpadding="0" cellspacing="0" style="margin:8px auto 0;background:rgba(52,211,153,0.1);border-radius:100px;padding:4px 16px">
<tr><td style="color:#34d399;font-size:13px;font-weight:700">&#10003; Active</td></tr>
</table>
</td></tr>
</table>
</td>
</tr>
</table>

<!-- Important Notice -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:linear-gradient(135deg,rgba(59,130,246,0.06),rgba(59,130,246,0.01));border:1px solid rgba(59,130,246,0.1);border-radius:20px;padding:24px 28px">
<tr><td>
<table cellpadding="0" cellspacing="0">
<tr>
<td width="36" valign="top" style="padding-top:2px">
<table cellpadding="0" cellspacing="0" style="width:32px;height:32px;background:rgba(59,130,246,0.12);border-radius:10px;text-align:center;vertical-align:middle">
<tr><td align="center" style="font-size:16px;color:#60a5fa">&#9432;</td></tr>
</table>
</td>
<td style="padding-left:14px">
<p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.7">Keep your Insurance ID handy. Doctors can use this ID during prior authorization requests. You can also find your membership details in your patient dashboard.</p>
</td>
</tr>
</table>
</td></tr>
</table>

<!-- Divider -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px"><tr><td style="border-top:1px solid rgba(255,255,255,0.06)"></td></tr></table>

<!-- Footer -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
<tr><td>
<table cellpadding="0" cellspacing="0">
<tr>
<td width="40" height="40" style="background:linear-gradient(135deg,#059669,#0d9488);border-radius:12px;text-align:center;vertical-align:middle">
<span style="color:#ffffff;font-size:18px;font-weight:700">Z</span>
</td>
<td style="padding-left:14px">
<p style="margin:0;color:#f1f5f9;font-size:14px;font-weight:700">Zintellect AI</p>
<p style="margin:2px 0 0;color:#64748b;font-size:12px">Intelligent Healthcare Platform</p>
</td>
</tr>
</table>
<p style="margin:16px 0 0;color:#475569;font-size:11px;line-height:1.6">This is an automated confirmation from Zintellect AI. Please do not reply to this email. For assistance, contact your healthcare provider.</p>
</td></tr>
</table>

</td></tr>

<!-- Footer Bar -->
<tr><td style="background:rgba(255,255,255,0.02);padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.04)">
<p style="margin:0;color:#475569;font-size:11px">Zintellect AI &bull; Prior Authorization Platform</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""

        message = MIMEMultipart("alternative")
        message["From"] = EMAIL_ADDRESS
        message["To"] = patient_email
        message["Subject"] = subject
        message.attach(MIMEText(html, "html"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, patient_email, message.as_string())
        server.quit()

        print("Insurance Email Sent Successfully")

    except Exception as error:
        print("Email Sending Failed:", error)


# ==========================================
# SEND DECISION EMAIL (Approve / Reject)
# ==========================================


def send_decision_email(
    to_email,
    doctor_name,
    patient_name,
    procedure_code,
    diagnosis,
    status,
    reasoning,
    provider_name,
):
    try:
        is_approved = status == "Approved"
        status_color = "22c55e" if is_approved else "ef4444"
        status_label = "Approved" if is_approved else "Not Approved"
        banner_icon = "&#10003;" if is_approved else "&#10007;"

        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

<!-- Header -->
<tr>
<td style="background:linear-gradient(135deg,{"#059669,#10b981" if is_approved else "#dc2626,#ef4444"});padding:32px 40px;text-align:center">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px">{provider_name}</td>
</tr>
<tr>
<td style="color:rgba(255,255,255,0.7);font-size:13px;padding-top:4px">Healthcare Authorization Notification</td>
</tr>
</table>
</td>
</tr>

<!-- Body -->
<tr><td style="padding:40px">
<table width="100%" cellpadding="0" cellspacing="0">

<!-- Subject -->
<tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px">
<p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px">Subject</p>
<p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#0f172a">Prior Authorization {status_label} &ndash; {patient_name}</p>
</td></tr>

<!-- Greeting -->
<tr><td style="padding-top:24px">
<p style="margin:0;font-size:15px;color:#475569;line-height:1.6">Dear Dr. {doctor_name or "Provider"},</p>
<p style="margin:12px 0 0;font-size:15px;color:#475569;line-height:1.6">{"We have completed our review of the prior authorization request and are pleased to inform you that it has been approved." if is_approved else "We have completed our review of the prior authorization request. After careful evaluation, it could not be approved at this time."}</p>
</td></tr>

<!-- Decision Banner -->
<tr><td style="padding-top:24px">
<table width="100%" cellpadding="0" cellspacing="0" style="background:{"#f0fdf4" if is_approved else "#fef2f2"};border:1px solid {"#bbf7d0" if is_approved else "#fecaca"};border-radius:12px;padding:20px">
<tr>
<td width="56" valign="middle" style="text-align:center">
<table width="48" height="48" cellpadding="0" cellspacing="0" style="background:{"#dcfce7" if is_approved else "#fee2e2"};border-radius:12px">
<tr><td align="center" style="font-size:24px;color:{"#16a34a" if is_approved else "#dc2626"};font-weight:700">{banner_icon}</td></tr>
</table>
</td>
<td style="padding-left:16px">
<p style="margin:0;font-size:18px;font-weight:700;color:{"#166534" if is_approved else "#991b1b"}">Authorization {"Approved" if is_approved else "Not Approved"}</p>
<p style="margin:4px 0 0;font-size:13px;color:{"#16a34a" if is_approved else "#dc2626"}">{"The requested procedure meets the required criteria." if is_approved else "The requested procedure does not meet the required criteria."}</p>
</td>
</tr>
</table>
</td></tr>

<!-- Request Details -->
<tr><td style="padding-top:24px">
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
<tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:12px 20px">
<p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px">Request Details</p>
</td></tr>
<tr><td style="padding:20px">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="50%" style="padding-bottom:16px">
<table cellpadding="0" cellspacing="0">
<tr><td width="32" height="32" style="background:#d1fae5;border-radius:8px;text-align:center;vertical-align:middle"><span style="font-size:14px;color:#059669">&#9679;</span></td>
<td style="padding-left:12px">
<p style="margin:0;font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Patient</p>
<p style="margin:2px 0 0;font-size:14px;font-weight:700;color:#0f172a">{patient_name}</p>
</td></tr>
</table>
</td>
<td width="50%" style="padding-bottom:16px">
<table cellpadding="0" cellspacing="0">
<tr><td width="32" height="32" style="background:#cffafe;border-radius:8px;text-align:center;vertical-align:middle"><span style="font-size:14px;color:#0891b2">&#9679;</span></td>
<td style="padding-left:12px">
<p style="margin:0;font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Doctor</p>
<p style="margin:2px 0 0;font-size:14px;font-weight:700;color:#0f172a">{doctor_name or "-"}</p>
</td></tr>
</table>
</td>
</tr>
<tr>
<td width="50%">
<table cellpadding="0" cellspacing="0">
<tr><td width="32" height="32" style="background:#ede9fe;border-radius:8px;text-align:center;vertical-align:middle"><span style="font-size:14px;color:#7c3aed">&#9679;</span></td>
<td style="padding-left:12px">
<p style="margin:0;font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Procedure</p>
<p style="margin:2px 0 0;font-size:14px;font-weight:700;color:#0f172a">{procedure_code or "-"}</p>
</td></tr>
</table>
</td>
<td width="50%">
<table cellpadding="0" cellspacing="0">
<tr><td width="32" height="32" style="background:#ffedd5;border-radius:8px;text-align:center;vertical-align:middle"><span style="font-size:14px;color:#ea580c">&#9679;</span></td>
<td style="padding-left:12px">
<p style="margin:0;font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Diagnosis</p>
<p style="margin:2px 0 0;font-size:14px;font-weight:700;color:#0f172a">{diagnosis or "-"}</p>
</td></tr>
</table>
</td>
</tr>
</table>
</td></tr>
</table>
</td></tr>

<!-- Reasoning -->
<tr><td style="padding-top:24px">
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;padding:20px">
<tr><td>
<table cellpadding="0" cellspacing="0">
<tr><td width="20" valign="top" style="font-size:16px;color:#94a3b8">&#9733;</td>
<td style="padding-left:8px">
<p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px">Clinical Reasoning</p>
<p style="margin:8px 0 0;font-size:14px;color:#475569;line-height:1.6">{reasoning or "AI analysis completed."}</p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>

<!-- Footer Message -->
<tr><td style="padding-top:24px">
<table width="100%" cellpadding="0" cellspacing="0" style="background:{"#f0fdf4" if is_approved else "#fef2f2"};border:1px solid {"#bbf7d0" if is_approved else "#fecaca"};border-radius:12px;padding:16px 20px">
<tr><td>
<p style="margin:0;font-size:13px;color:#475569;line-height:1.6">
{"This authorization is valid for 30 days from the date of this notification. If you have any questions, please contact our provider services department." if is_approved else "If you believe this decision was made in error or have additional clinical information, you may submit an appeal with supporting documentation for reconsideration."}
</p>
</td></tr>
</table>
</td></tr>

<!-- Signature -->
<tr><td style="padding-top:32px;border-top:1px solid #e2e8f0">
<table cellpadding="0" cellspacing="0">
<tr>
<td width="40" height="40" style="background:linear-gradient(135deg,#059669,#0d9488);border-radius:10px;text-align:center;vertical-align:middle"><span style="color:#ffffff;font-size:18px">&#9679;</span></td>
<td style="padding-left:12px">
<p style="margin:0;font-size:14px;font-weight:700;color:#0f172a">{provider_name}</p>
<p style="margin:2px 0 0;font-size:11px;color:#94a3b8">Provider Services Department</p>
</td>
</tr>
</table>
<p style="margin:12px 0 0;font-size:11px;color:#94a3b8;line-height:1.5">This is an automated notification. Please do not reply to this email.</p>
</td></tr>

</table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 40px;text-align:center">
<p style="margin:0;font-size:11px;color:#94a3b8">{provider_name} &bull; Healthcare Authorization Portal</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""

        subject = f"Prior Authorization {status_label} – {patient_name}"

        message = MIMEMultipart("alternative")
        message["From"] = EMAIL_ADDRESS
        message["To"] = to_email
        message["Subject"] = subject
        message.attach(MIMEText(html, "html"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, to_email, message.as_string())
        server.quit()

        print(f"Decision email sent to {to_email}")
        return True

    except Exception as error:
        print("Decision email sending failed:", error)
        return False


# ==========================================
# SEND PATIENT DECISION EMAIL
# ==========================================


def send_patient_decision_email(
    to_email,
    patient_name,
    procedure_code,
    diagnosis,
    status,
    provider_name,
):
    try:
        is_approved = status == "Approved"
        status_label = "Approved" if is_approved else "Not Approved"

        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

<!-- Header -->
<tr>
<td style="background:linear-gradient(135deg,{"#059669,#10b981" if is_approved else "#dc2626,#ef4444"});padding:32px 40px;text-align:center">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px">{provider_name}</td>
</tr>
<tr>
<td style="color:rgba(255,255,255,0.7);font-size:13px;padding-top:4px">Prior Authorization Notification</td>
</tr>
</table>
</td>
</tr>

<!-- Body -->
<tr><td style="padding:40px">
<table width="100%" cellpadding="0" cellspacing="0">

<!-- Subject -->
<tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px">
<p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px">Subject</p>
<p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#0f172a">Prior Authorization {status_label} &ndash; {patient_name}</p>
</td></tr>

<!-- Greeting -->
<tr><td style="padding-top:24px">
<p style="margin:0;font-size:15px;color:#475569;line-height:1.6">Dear {patient_name},</p>
<p style="margin:12px 0 0;font-size:15px;color:#475569;line-height:1.6">{"We are pleased to inform you that your prior authorization request has been approved. Your insurance provider has reviewed your case and the requested procedure has been authorized." if is_approved else "We have completed our review of your prior authorization request. After careful evaluation, the request could not be approved at this time."}</p>
</td></tr>

<!-- Decision Banner -->
<tr><td style="padding-top:24px">
<table width="100%" cellpadding="0" cellspacing="0" style="background:{"#f0fdf4" if is_approved else "#fef2f2"};border:1px solid {"#bbf7d0" if is_approved else "#fecaca"};border-radius:12px;padding:20px">
<tr>
<td width="56" valign="middle" style="text-align:center">
<table width="48" height="48" cellpadding="0" cellspacing="0" style="background:{"#dcfce7" if is_approved else "#fee2e2"};border-radius:12px">
<tr><td align="center" style="font-size:24px;color:{"#16a34a" if is_approved else "#dc2626"};font-weight:700">{"&#10003;" if is_approved else "&#10007;"}</td></tr>
</table>
</td>
<td style="padding-left:16px">
<p style="margin:0;font-size:18px;font-weight:700;color:{"#166534" if is_approved else "#991b1b"}">Authorization {"Approved" if is_approved else "Not Approved"}</p>
<p style="margin:4px 0 0;font-size:13px;color:{"#16a34a" if is_approved else "#dc2626"}">{"Your procedure has been authorized." if is_approved else "The requested procedure could not be authorized."}</p>
</td>
</tr>
</table>
</td></tr>

<!-- Request Details -->
<tr><td style="padding-top:24px">
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
<tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:12px 20px">
<p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px">Request Details</p>
</td></tr>
<tr><td style="padding:20px">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding-bottom:12px">
<p style="margin:0;font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Procedure</p>
<p style="margin:2px 0 0;font-size:14px;font-weight:700;color:#0f172a">{procedure_code or "-"}</p>
</td>
</tr>
<tr>
<td style="padding-bottom:12px">
<p style="margin:0;font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Diagnosis</p>
<p style="margin:2px 0 0;font-size:14px;font-weight:700;color:#0f172a">{diagnosis or "-"}</p>
</td>
</tr>
</table>
</td></tr>
</table>
</td></tr>

<!-- Footer Message -->
<tr><td style="padding-top:24px">
<table width="100%" cellpadding="0" cellspacing="0" style="background:{"#f0fdf4" if is_approved else "#fef2f2"};border:1px solid {"#bbf7d0" if is_approved else "#fecaca"};border-radius:12px;padding:16px 20px">
<tr><td>
<p style="margin:0;font-size:13px;color:#475569;line-height:1.6">
{"This authorization is valid for 30 days. If you have any questions, please contact your healthcare provider." if is_approved else "If you believe this decision was made in error, please contact your healthcare provider for more information about the appeals process."}
</p>
</td></tr>
</table>
</td></tr>

<!-- Signature -->
<tr><td style="padding-top:32px;border-top:1px solid #e2e8f0">
<table cellpadding="0" cellspacing="0">
<tr>
<td width="40" height="40" style="background:linear-gradient(135deg,#059669,#0d9488);border-radius:10px;text-align:center;vertical-align:middle"><span style="color:#ffffff;font-size:18px">&#9679;</span></td>
<td style="padding-left:12px">
<p style="margin:0;font-size:14px;font-weight:700;color:#0f172a">{provider_name}</p>
<p style="margin:2px 0 0;font-size:11px;color:#94a3b8">Insurance Provider</p>
</td>
</tr>
</table>
<p style="margin:12px 0 0;font-size:11px;color:#94a3b8;line-height:1.5">This is an automated notification. Please do not reply to this email.</p>
</td></tr>

</table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 40px;text-align:center">
<p style="margin:0;font-size:11px;color:#94a3b8">{provider_name} &bull; Prior Authorization Portal</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""

        subject = f"Prior Authorization {status_label} – {patient_name}"

        message = MIMEMultipart("alternative")
        message["From"] = EMAIL_ADDRESS
        message["To"] = to_email
        message["Subject"] = subject
        message.attach(MIMEText(html, "html"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, to_email, message.as_string())
        server.quit()

        print(f"Patient decision email sent to {to_email}")
        return True

    except Exception as error:
        print("Patient decision email sending failed:", error)
        return False
