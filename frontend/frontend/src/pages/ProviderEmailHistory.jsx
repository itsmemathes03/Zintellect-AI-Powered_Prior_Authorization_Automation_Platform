import { useState, useEffect } from "react"
import {
  Mail, Search, Calendar, User, Stethoscope, Activity, FileText,
  ExternalLink, BadgeCheck, ChevronLeft, ChevronRight
} from "lucide-react"
import { useToast } from "../components/Toast"
import PageHeader from "../components/ui/PageHeader"
import Badge from "../components/ui/Badge"
import DataTable from "../components/ui/DataTable"
import Modal from "../components/ui/Modal"
import Button from "../components/ui/Button"

export default function ProviderEmailHistory() {
  const token = localStorage.getItem("access_token")
  const { addToast } = useToast()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState(null)
  const pageSize = 15

  useEffect(() => { fetchLogs() }, [page, search])

  async function fetchLogs() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, page_size: pageSize })
      if (search) params.append("search", search)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/provider/email-history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setLogs(data.items || [])
      setTotal(data.total || 0)
    } catch (e) { console.log(e); addToast("Failed to load email history", "error") }
    setLoading(false)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const columns = [
    {
      header: "Date",
      width: "14%",
      render: (log) => (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Calendar size={14} />
          {log.sent_at ? new Date(log.sent_at).toLocaleDateString() : "-"}
        </div>
      ),
    },
    {
      header: "Patient",
      render: (log) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center flex-shrink-0">
            <User size={15} className="text-teal-600 dark:text-teal-400" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">{log.patient_name}</span>
        </div>
      ),
    },
    { header: "Doctor", render: (log) => <span className="text-sm text-slate-600 dark:text-slate-400">{log.doctor_name || "-"}</span> },
    { header: "Procedure", render: (log) => <span className="font-mono text-sm font-bold text-brand-700 dark:text-brand-400">{log.procedure_code || "-"}</span> },
    { header: "Sent To", render: (log) => <span className="text-sm text-slate-500 dark:text-slate-400">{log.to_email}</span> },
    {
      header: "Decision",
      className: "text-center",
      cellClassName: "text-center",
      render: (log) => <Badge color={log.status === "Approved" ? "green" : log.status === "Rejected" ? "red" : "gray"}>{log.status || "-"}</Badge>,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email History"
        description={`${total} emails sent`}
        icon={Mail}
      />

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by patient, doctor, or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="input-field pl-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        emptyMessage="No emails sent yet"
        onRowClick={(log) => setSelected(log)}
      />

      {!loading && logs.length > 0 && totalPages > 1 && (
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

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Email Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
              <div className="flex items-center gap-2 mb-1">
                <BadgeCheck size={16} className="text-teal-600" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Subject</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{selected.subject}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} className="text-teal-600" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Patient</span>
                </div>
                <p className="font-bold text-slate-900 dark:text-white">{selected.patient_name}</p>
              </div>
              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope size={14} className="text-teal-600" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Doctor</span>
                </div>
                <p className="font-bold text-slate-900 dark:text-white">{selected.doctor_name || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={14} className="text-teal-600" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Procedure</span>
                </div>
                <p className="font-bold text-slate-900 dark:text-white">{selected.procedure_code || "-"}</p>
              </div>
              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-teal-600" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Decision</span>
                </div>
                <Badge color={selected.status === "Approved" ? "green" : selected.status === "Rejected" ? "red" : "gray"}>{selected.status || "-"}</Badge>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
              <div className="flex items-center gap-2 mb-2">
                <Mail size={14} className="text-teal-600" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Recipient</span>
              </div>
              <p className="font-bold text-slate-900 dark:text-white">{selected.to_email}</p>
            </div>

            <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-teal-600" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Sent At</span>
              </div>
              <p className="font-bold text-slate-900 dark:text-white">
                {selected.sent_at ? new Date(selected.sent_at).toLocaleString() : "-"}
              </p>
            </div>

            {selected.request_id && (
              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink size={14} className="text-teal-600" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Request ID</span>
                </div>
                <p className="font-mono text-sm text-slate-900 dark:text-white">{selected.request_id}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}