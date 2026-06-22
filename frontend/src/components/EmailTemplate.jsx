import { useState } from "react"
import {
  Building2, CheckCircle2, XCircle, ShieldCheck, FileText, Calendar,
  User, Stethoscope, Activity, ArrowRight, Sparkles, Send, Loader2, Check, Mail,
  Award, HeartPulse, BadgeCheck, Clock
} from "lucide-react"

export default function EmailTemplate({ request, decision, onClose }) {
  const isApproved = decision === "Approved"
  const providerName = localStorage.getItem("provider_name") || "Insurance Provider"
  const token = localStorage.getItem("access_token")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [emailTo, setEmailTo] = useState("")

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  })

  const handleSend = async () => {
    if (!emailTo) { alert("Enter recipient email"); return }
    setSending(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/provider/requests/${request?.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          to_email: emailTo,
          doctor_name: request?.doctor_name,
          patient_name: request?.patient_name,
          procedure_code: request?.procedure_code,
          diagnosis: request?.diagnosis,
          status: decision,
          reasoning: request?.xai_reasoning,
        }),
      })
      const data = await res.json()
      if (data.status === "Success") { setSent(true) }
      else { alert(data.detail || "Failed to send") }
    } catch (e) { alert("Failed to send email") }
    setSending(false)
  }

  const theme = isApproved
    ? {
        header: "from-emerald-900 via-emerald-700 to-emerald-500",
        glow: "bg-emerald-400/20",
        badge: "bg-emerald-500",
        lightBg: "bg-emerald-50/80",
        lightBorder: "border-emerald-200",
        accent: "text-emerald-600",
        accentBg: "bg-emerald-100",
        dark: "text-emerald-900",
        label: "Approved",
        Icon: CheckCircle2,
        msg: "The requested procedure meets the required criteria and has been authorized.",
        footer: "This authorization is valid for 30 days from the date of this notification. Please ensure all services are rendered within this period. If you have any questions, please contact our provider services department.",
        ring: "ring-emerald-400",
      }
    : {
        header: "from-red-900 via-red-700 to-red-500",
        glow: "bg-red-400/20",
        badge: "bg-red-500",
        lightBg: "bg-red-50/80",
        lightBorder: "border-red-200",
        accent: "text-red-600",
        accentBg: "bg-red-100",
        dark: "text-red-900",
        label: "Not Approved",
        Icon: XCircle,
        msg: "The requested procedure does not meet the required criteria at this time.",
        footer: "If you believe this decision was made in error or have additional clinical information to support this request, you may submit an appeal with supporting documentation for reconsideration.",
        ring: "ring-red-400",
      }

  const StatusIcon = theme.Icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white rounded-[32px] shadow-[0_0_60px_rgba(0,0,0,0.15)] border border-white/40 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">

        {/* Decorative glow */}
        <div className={`absolute -top-20 -right-20 w-64 h-64 ${theme.glow} rounded-full blur-[100px] pointer-events-none`} />
        <div className={`absolute -bottom-20 -left-20 w-64 h-64 ${theme.glow} rounded-full blur-[100px] pointer-events-none`} />

        {/* Header */}
        <div className={`relative bg-gradient-to-br ${theme.header} px-8 pt-10 pb-8 overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-xl">
                <Building2 className="text-white" size={26} />
              </div>
              <div>
                <h2 className="text-white font-extrabold text-xl tracking-tight">{providerName}</h2>
                <p className="text-white/60 text-xs font-medium tracking-wide mt-0.5">Healthcare Authorization Portal</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-white/50 text-[9px] font-bold uppercase tracking-[2px]">Decision</p>
              <div className="flex items-center gap-1.5 mt-1 justify-center">
                <div className={`w-2 h-2 rounded-full ${theme.badge} animate-pulse`} />
                <p className="text-white font-extrabold text-sm">{theme.label}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-7">

          {/* Subject + Date */}
          <div className="flex items-start justify-between gap-4">
            <div className="bg-slate-50/80 backdrop-blur rounded-2xl border border-slate-200/80 p-4 flex-1">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[2px] mb-1.5">Subject</p>
              <p className="text-base font-extrabold text-slate-900 leading-snug">
                {isApproved
                  ? `Prior Authorization Approved – ${request?.patient_name || "Patient"}`
                  : `Prior Authorization Decision – ${request?.patient_name || "Patient"}`
                }
              </p>
            </div>
            <div className="bg-slate-50/80 backdrop-blur rounded-2xl border border-slate-200/80 p-4 text-center min-w-[100px]">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[2px] mb-1.5">Date</p>
              <p className="text-xs font-bold text-slate-700 leading-tight">{date}</p>
            </div>
          </div>

          {/* Greeting */}
          <div className="bg-gradient-to-r from-slate-50 to-white rounded-2xl p-5 border border-slate-100">
            <p className="text-slate-700 leading-relaxed text-[15px]">
              Dear <span className="font-bold text-slate-900">Dr. {request?.doctor_name || "Provider"}</span>,
            </p>
            <p className="text-slate-600 leading-relaxed mt-3 text-[15px]">
              {isApproved
                ? "We have completed our review of the prior authorization request. We are pleased to inform you that the request has been approved."
                : "We have completed our review of the prior authorization request. After careful evaluation, the request could not be approved at this time."
              }
            </p>
          </div>

          {/* Decision Banner */}
          <div className={`relative ${theme.lightBg} border-2 ${theme.lightBorder} rounded-2xl p-6 overflow-hidden`}>
            <div className={`absolute -top-10 -right-10 w-32 h-32 ${theme.glow} rounded-full blur-[60px] pointer-events-none`} />
            <div className="relative flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl ${theme.accentBg} flex items-center justify-center shadow-lg`}>
                <StatusIcon className={theme.accent} size={32} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                  <h3 className={`text-xl font-extrabold ${theme.dark}`}>
                    Authorization {theme.label}
                  </h3>
                  <Award className={theme.accent} size={20} />
                </div>
                <p className={`text-sm mt-1 ${theme.accent} font-medium`}>{theme.msg}</p>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-3.5 border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <FileText size={15} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[2px]">Request Details</span>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: User, bg: "bg-emerald-100", color: "text-emerald-600", label: "Patient", value: request?.patient_name },
                  { icon: Stethoscope, bg: "bg-cyan-100", color: "text-cyan-600", label: "Doctor", value: request?.doctor_name || "-" },
                  { icon: Activity, bg: "bg-purple-100", color: "text-purple-600", label: "Procedure", value: request?.procedure_code || "-" },
                  { icon: Clock, bg: "bg-orange-100", color: "text-orange-600", label: "Urgency", value: request?.urgency_level || "Medium" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50/60 rounded-xl p-3.5 border border-slate-100/80">
                    <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center`}>
                      <item.icon size={17} className={item.color} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">{item.label}</p>
                      <p className="font-bold text-slate-900 text-sm truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-slate-50/60 rounded-xl p-4 border border-slate-100/80">
                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Diagnosis</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{request?.diagnosis || "-"}</p>
              </div>
            </div>
          </div>

          {/* Clinical Reasoning */}
          {request?.xai_reasoning && (
            <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-purple-50/80 to-white px-5 py-3.5 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <Brain size={15} className="text-purple-500" />
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-[2px]">Clinical Reasoning</span>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-slate-600 leading-relaxed">{request.xai_reasoning}</p>
                {request.confidence_score && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${isApproved ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-red-400 to-red-600"}`}
                        style={{ width: `${Math.min((request.confidence_score || 0) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={12} className="text-purple-500" />
                      <span className="text-xs font-bold text-slate-500">{((request.confidence_score || 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Message */}
          <div className={`relative ${theme.lightBg} border ${theme.lightBorder} rounded-2xl p-5 overflow-hidden`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full blur-2xl" />
            <div className="relative flex items-start gap-3">
              <ShieldCheck className={`shrink-0 mt-0.5 ${theme.accent}`} size={18} />
              <p className="text-sm text-slate-600 leading-relaxed">{theme.footer}</p>
            </div>
          </div>

          {/* Signature */}
          <div className="border-t border-slate-200/80 pt-6">
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <ShieldCheck className="text-white" size={22} />
              </div>
              <div>
                <p className="font-extrabold text-slate-900">{providerName}</p>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">Provider Services Department</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This is an automated notification from the {providerName} portal. Please do not reply to this email.
              For inquiries, contact provider services.
            </p>
          </div>
        </div>

        {/* Send Email */}
        <div className="border-t border-slate-200/80 bg-gradient-to-r from-slate-50/80 to-white px-8 py-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email" placeholder="doctor@hospital.com"
                value={emailTo} onChange={(e) => setEmailTo(e.target.value)}
                disabled={sent}
                className="w-full border border-slate-200 rounded-xl py-3.5 pl-10 pr-4 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 text-sm text-slate-900 transition-all"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={sending || sent}
              className={`flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${
                sent
                  ? "bg-emerald-100 text-emerald-700 shadow-emerald-200/50"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:scale-[1.03] hover:shadow-emerald-300/50"
              } disabled:opacity-50`}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : sent ? <Check size={16} /> : <Send size={16} />}
              {sent ? "Sent Successfully" : "Send Email"}
            </button>
            <button
              onClick={onClose}
              className="bg-white hover:bg-slate-50 text-slate-600 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all border border-slate-200"
            >
              Close
            </button>
          </div>
          {sent && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-200">
              <BadgeCheck size={16} />
              <span className="text-sm font-semibold">Email delivered successfully to {emailTo}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
