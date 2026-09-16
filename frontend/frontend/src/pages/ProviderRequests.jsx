import { useState, useEffect } from "react"
import {
  ClipboardList, Search, FileText, Calendar, X, Stethoscope, User, Activity, Brain,
  ShieldCheck, CheckCircle2, XCircle, FileWarning, Sparkles, BadgeCheck, Building2, ChevronLeft, ChevronRight
} from "lucide-react"
import EmailTemplate from "../components/EmailTemplate"
import { useToast } from "../components/Toast"
import PageHeader from "../components/ui/PageHeader"
import PageTransition from "../components/PageTransition"
import Badge from "../components/ui/Badge"
import DataTable from "../components/ui/DataTable"
import Modal from "../components/ui/Modal"
import Button from "../components/ui/Button"

const statusColor = {
  Approved: "green",
  Rejected: "red",
  Pending: "amber",
  "Manual Review": "orange",
  "Awaiting Review": "amber",
  Processing: "blue",
}

const confidenceColor = (score) => (score >= 0.8 ? "text-success-600 dark:text-success-500" : score >= 0.5 ? "text-warning-600 dark:text-warning-500" : "text-danger-600 dark:text-danger-500")

export default function ProviderRequests() {
  const token = localStorage.getItem("access_token")
  const { addToast } = useToast()
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

  useEffect(() => { fetchRequests() }, [page, search, statusFilter])

  async function fetchRequests({ silent = false } = {}) {
    if (!silent) setLoading(true)
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
    } catch (e) { console.log(e); addToast("Failed to load requests", "error") }
    setLoading(false)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const statuses = ["", "Approved", "Pending", "Rejected", "Manual Review", "Awaiting Review"]

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
        setEmailPreview({ request: updated, decision: status })
        if (data.patient_notified) {
          setPatientNotified({ patient: updated?.patient_name, status })
        }
      } else {
        addToast(data.message || "Action failed", "error")
      }
    } catch (e) {
      console.log(e)
      addToast("Action failed", "error")
    }
    setActionLoading(false)
  }

  const columns = [
    {
      header: "Patient",
      render: (req) => <span className="font-semibold text-slate-900 dark:text-white">{req.patient_name}</span>,
    },
    { header: "Doctor", render: (req) => <span className="text-sm text-slate-600 dark:text-slate-400">{req.doctor_name || "-"}</span> },
    { header: "Procedure", render: (req) => <span className="font-mono text-sm font-bold text-brand-700 dark:text-brand-400">{req.procedure_code}</span> },
    { header: "Diagnosis", className: "", cellClassName: "max-w-[200px]", render: (req) => <span className="text-sm text-slate-600 dark:text-slate-400 block truncate">{req.diagnosis || "-"}</span> },
    {
      header: "Confidence",
      className: "text-center",
      cellClassName: "text-center",
      render: (req) => (
        <span className={`font-bold text-sm ${confidenceColor(req.confidence_score)}`}>
          {req.confidence_score ? `${(req.confidence_score * 100).toFixed(0)}%` : "-"}
        </span>
      ),
    },
    {
      header: "Status",
      className: "text-center",
      cellClassName: "text-center",
      render: (req) => <Badge color={statusColor[req.status] || "gray"}>{req.status}</Badge>,
    },
    {
      header: "Submitted",
      render: (req) => (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Calendar size={14} />
          {req.created_at ? new Date(req.created_at).toLocaleDateString() : "-"}
        </div>
      ),
    },
  ]

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Authorization Requests"
          description={`${total} total requests`}
          icon={ClipboardList}
        />

        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient, diagnosis, or procedure..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="input-field pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="input-field max-w-xs"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s || "All Statuses"}</option>
            ))}
          </select>
        </div>

        <DataTable
          columns={columns}
          data={requests}
          loading={loading}
          emptyMessage="No authorization requests found"
          onRowClick={(req) => setSelected(req)}
        />

        {!loading && requests.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} aria-label="Previous page">
                <ChevronLeft size={16} />
              </Button>
              <Badge color="gray" className="px-3 py-1.5 tabular-nums">Page {page} of {totalPages}</Badge>
              <Button variant="secondary" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label="Next page">
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        <Modal open={!!selected} onClose={() => setSelected(null)} title="Request Details" size="lg">
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge color={statusColor[selected.status] || "gray"} size="lg">{selected.status}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-brand-600" />
                    <span className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide">Patient</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selected.patient_name}</p>
                  {selected.patient_id && <p className="text-sm text-slate-500 dark:text-slate-400">ID: {selected.patient_id}</p>}
                </div>
                <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope size={16} className="text-brand-600" />
                    <span className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide">Doctor</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selected.doctor_name || "-"}</p>
                  {selected.insurance_provider && <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1"><Building2 size={12} /> {selected.insurance_provider}</p>}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={16} className="text-brand-600" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Clinical Info</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Procedure Code</p>
                    <p className="font-bold text-slate-900 dark:text-white">{selected.procedure_code || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Urgency</p>
                    <p className="font-bold text-slate-900 dark:text-white">{selected.urgency_level || "Medium"}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Diagnosis</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{selected.diagnosis || "-"}</p>
                </div>
                {selected.clinical_notes && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Clinical Notes</p>
                    <p className="text-sm text-slate-900 dark:text-white mt-1 whitespace-pre-line">{selected.clinical_notes}</p>
                  </div>
                )}
              </div>

              {selected.uploaded_files && (
                <div className="bg-teal-50 dark:bg-teal-500/10 rounded-xl p-4 border border-teal-200 dark:border-teal-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-teal-600" />
                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-500 uppercase tracking-wide">Uploaded Files</span>
                  </div>
                  <p className="text-sm text-slate-900 dark:text-white whitespace-pre-line">{selected.uploaded_files}</p>
                </div>
              )}

              {selected.xai_reasoning && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={16} className="text-purple-600" />
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">AI Analysis</span>
                  </div>
                  <p className="text-sm text-slate-900 dark:text-white whitespace-pre-line">{selected.xai_reasoning}</p>
                  {selected.confidence_score && (
                    <div className="mt-3 flex items-center gap-2">
                      <Sparkles size={14} className="text-purple-500" />
                      <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                        Confidence: {(selected.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              {selected.matched_policy_clause && (
                <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4 border border-brand-200 dark:border-brand-800">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-brand-600" />
                    <span className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide">Matched Policy</span>
                  </div>
                  <p className="text-sm text-slate-900 dark:text-white whitespace-pre-line">{selected.matched_policy_clause}</p>
                </div>
              )}

              {selected.missing_documents && (
                <div className="bg-warning-50 dark:bg-warning-500/10 rounded-xl p-4 border border-warning-200 dark:border-warning-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FileWarning size={16} className="text-warning-600" />
                    <span className="text-xs font-semibold text-warning-700 dark:text-warning-500 uppercase tracking-wide">Missing Documents</span>
                  </div>
                  <p className="text-sm text-slate-900 dark:text-white whitespace-pre-line">{selected.missing_documents}</p>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-slate-500" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Timeline</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Submitted</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{selected.created_at ? new Date(selected.created_at).toLocaleString() : "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Last Updated</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{selected.updated_at ? new Date(selected.updated_at).toLocaleString() : "-"}</p>
                  </div>
                </div>
              </div>

              {(selected.status === "Pending" || selected.status === "Processing" || selected.status === "Awaiting Review") && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
                  <Button variant="danger" onClick={() => { setSelected(null); handleAction(selected.id, "Rejected") }} disabled={actionLoading} loading={actionLoading}>
                    <XCircle size={16} /> Reject
                  </Button>
                  <Button variant="success" onClick={() => { setSelected(null); handleAction(selected.id, "Approved") }} disabled={actionLoading} loading={actionLoading}>
                    <CheckCircle2 size={16} /> Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {patientNotified && (
          <div className="fixed bottom-6 right-6 z-50 bg-navy-900 text-white rounded-xl shadow-modal border border-navy-700 px-6 py-4 flex items-center gap-3 max-w-md animate-slide-up">
            <BadgeCheck size={20} className="text-teal-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">Patient Notified</p>
              <p className="text-slate-300 text-xs mt-0.5">
                {patientNotified.patient} has been notified of the {patientNotified.status.toLowerCase()} decision via email.
              </p>
            </div>
            <button onClick={() => setPatientNotified(null)} className="p-1 rounded-lg hover:bg-navy-800 transition-colors ml-2" aria-label="Dismiss notification">
              <X size={16} className="text-slate-300" />
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
      </div>
    </PageTransition>
  )
}