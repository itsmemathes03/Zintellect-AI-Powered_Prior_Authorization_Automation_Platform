import { useState, useEffect } from "react"
import { Fragment } from "react"
import {
  ClipboardList, Search, FileText, Calendar, ChevronLeft, ChevronRight,
  X, Stethoscope, User, Activity, Brain, ShieldCheck, AlertTriangle,
  CheckCircle2, XCircle, Clock, Building2, FileWarning, Sparkles, Loader2, Mail, BadgeCheck
} from "lucide-react"
import EmailTemplate from "../components/EmailTemplate"

export default function ProviderRequests() {
  const token = localStorage.getItem("access_token")
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [emailPreview, setEmailPreview] = useState(null)
  const [patientNotified, setPatientNotified] = useState(null)
  const pageSize = 15

  useEffect(() => {
    fetchRequests()
  }, [page, search, statusFilter])

  async function fetchRequests() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, page_size: pageSize })
      if (search) params.append("search", search)
      if (statusFilter) params.append("status", statusFilter)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/provider/requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setRequests(data.items || [])
      setTotal(data.total || 0)
    } catch (e) { console.log(e) }
    setLoading(false)
  }

  const totalPages = Math.ceil(total / pageSize)

  const getStatusBadge = (status) => {
    const map = {
      Approved: "bg-emerald-100 text-emerald-700 border-emerald-300",
      Rejected: "bg-red-100 text-red-700 border-red-300",
      Pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
      "Manual Review": "bg-orange-100 text-orange-700 border-orange-300",
    }
    return map[status] || "bg-slate-100 text-slate-600 border-slate-300"
  }

  const statuses = ["", "Approved", "Pending", "Rejected", "Manual Review"]

  const handleAction = async (id, status) => {
    setActionLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/provider/requests/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.status === "Success") {
        const updated = selected ? { ...selected, status } : null
        setSelected(null)
        setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
        if (data.patient_notified) {
          setPatientNotified({ patient: updated?.patient_name, status })
        }
        setEmailPreview({ request: updated, decision: status })
      } else {
        alert(data.message || "Action failed")
      }
    } catch (e) { console.log(e); alert("Action failed") }
    setActionLoading(false)
  }

  return (
    <><div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-inner">
          <ClipboardList className="text-emerald-700" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-950">Authorization Requests</h1>
          <p className="text-slate-500 text-sm">{total} total requests</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text" placeholder="Search by patient, diagnosis, or procedure..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm text-slate-900"
          />
        </div>
        <select
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="border border-slate-200 rounded-2xl py-4 px-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm text-slate-900"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s || "All Statuses"}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100/50 p-16 text-center">
          <FileText className="mx-auto text-slate-300" size={64} />
          <h3 className="text-2xl font-bold text-emerald-950 mt-6">No Requests Found</h3>
          <p className="text-slate-500 mt-3">No authorization requests match your search criteria.</p>
        </div>
      ) : (
        <>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-emerald-100 bg-emerald-50/50">
                    <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Patient</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Doctor</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Procedure</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Diagnosis</th>
                    <th className="text-center py-4 px-6 font-bold text-slate-700 text-sm">Confidence</th>
                    <th className="text-center py-4 px-6 font-bold text-slate-700 text-sm">Status</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => setSelected(req)}
                      className="border-b border-slate-100 hover:bg-emerald-50/50 transition-all cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-900">{req.patient_name}</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">{req.doctor_name || "-"}</td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm font-bold text-emerald-700">{req.procedure_code}</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600 max-w-[200px] truncate">{req.diagnosis || "-"}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`font-bold text-sm ${
                          req.confidence_score >= 0.8 ? "text-emerald-600" : req.confidence_score >= 0.5 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {req.confidence_score ? `${(req.confidence_score * 100).toFixed(0)}%` : "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`border px-3 py-1.5 rounded-full text-xs font-bold ${getStatusBadge(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar size={14} />
                          {req.created_at ? new Date(req.created_at).toLocaleDateString() : "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-emerald-100 bg-emerald-50/30">
                <p className="text-sm text-slate-600">
                  Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl hover:bg-emerald-100 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft size={20} className="text-slate-600" />
                  </button>
                  <span className="text-sm font-bold text-emerald-950 px-3">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-xl hover:bg-emerald-100 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight size={20} className="text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-3xl max-h-[90vh] overflow-y-auto z-10">
            <div className="sticky top-0 bg-white border-b border-emerald-100 rounded-t-3xl flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <FileText className="text-emerald-700" size={22} />
                <h2 className="text-xl font-bold text-emerald-950">Request Details</h2>
                <span className={`border px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(selected.status)}`}>
                  {selected.status}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-slate-100 transition-all">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Patient</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{selected.patient_name}</p>
                  {selected.patient_id && <p className="text-sm text-slate-500">ID: {selected.patient_id}</p>}
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope size={16} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Doctor</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{selected.doctor_name || "-"}</p>
                  {selected.insurance_provider && <p className="text-sm text-slate-500">{selected.insurance_provider}</p>}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={16} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Clinical Info</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Procedure Code</p>
                    <p className="font-bold text-slate-900">{selected.procedure_code || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Urgency</p>
                    <p className="font-bold text-slate-900">{selected.urgency_level || "Medium"}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-500">Diagnosis</p>
                  <p className="text-sm text-slate-900 mt-1">{selected.diagnosis || "-"}</p>
                </div>
                {selected.clinical_notes && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500">Clinical Notes</p>
                    <p className="text-sm text-slate-900 mt-1 whitespace-pre-line">{selected.clinical_notes}</p>
                  </div>
                )}
              </div>

              {selected.uploaded_files && (
                <div className="bg-cyan-50 rounded-2xl p-4 border border-cyan-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-cyan-600" />
                    <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">Uploaded Files</span>
                  </div>
                  <p className="text-sm text-slate-900 whitespace-pre-line">{selected.uploaded_files}</p>
                </div>
              )}

              {selected.xai_reasoning && (
                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={16} className="text-purple-600" />
                    <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">AI Analysis</span>
                  </div>
                  <p className="text-sm text-slate-900 whitespace-pre-line">{selected.xai_reasoning}</p>
                  {selected.confidence_score && (
                    <div className="mt-3 flex items-center gap-2">
                      <Sparkles size={14} className="text-purple-500" />
                      <span className="text-sm font-semibold text-purple-700">
                        Confidence: {(selected.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              {selected.matched_policy_clause && (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Matched Policy</span>
                  </div>
                  <p className="text-sm text-slate-900 whitespace-pre-line">{selected.matched_policy_clause}</p>
                </div>
              )}

              {selected.missing_documents && (
                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FileWarning size={16} className="text-orange-600" />
                    <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Missing Documents</span>
                  </div>
                  <p className="text-sm text-slate-900 whitespace-pre-line">{selected.missing_documents}</p>
                </div>
              )}

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-slate-500" />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Timeline</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Submitted</p>
                    <p className="font-semibold text-slate-900">{selected.created_at ? new Date(selected.created_at).toLocaleString() : "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Last Updated</p>
                    <p className="font-semibold text-slate-900">{selected.updated_at ? new Date(selected.updated_at).toLocaleString() : "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {(selected.status === "Pending" || selected.status === "Processing") && (
              <div className="sticky bottom-0 bg-white border-t border-emerald-100 rounded-b-3xl px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setSelected(null); handleAction(selected.id, "Rejected") }}
                  disabled={actionLoading}
                  className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                  Reject
                </button>
                <button
                  onClick={() => { setSelected(null); handleAction(selected.id, "Approved") }}
                  disabled={actionLoading}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {patientNotified && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white rounded-2xl shadow-2xl border border-emerald-700 px-6 py-4 flex items-center gap-3 max-w-md animate-slide-up">
          <BadgeCheck size={20} className="text-emerald-300 shrink-0" />
          <div>
            <p className="font-bold text-sm">Patient Notified</p>
            <p className="text-emerald-200 text-xs mt-0.5">
              {patientNotified.patient} has been notified of the {patientNotified.status.toLowerCase()} decision via email.
            </p>
          </div>
          <button onClick={() => setPatientNotified(null)} className="p-1 rounded-lg hover:bg-emerald-800 transition-all ml-2">
            <X size={16} className="text-emerald-300" />
          </button>
        </div>
      )}

      {emailPreview && (
        <EmailTemplate
          request={emailPreview.request}
          decision={emailPreview.decision}
          onClose={() => setEmailPreview(null)}
        />
      )}
    </div></>
  )
}
