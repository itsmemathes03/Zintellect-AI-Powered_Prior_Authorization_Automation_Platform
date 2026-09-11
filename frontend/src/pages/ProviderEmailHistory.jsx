import { useState, useEffect } from "react"
import {
  Mail, Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Calendar, User, Stethoscope, Activity, FileText, Clock,
  ExternalLink, BadgeCheck, X
} from "lucide-react"

export default function ProviderEmailHistory() {
  const token = localStorage.getItem("access_token")
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState(null)
  const pageSize = 15

  useEffect(() => {
    fetchLogs()
  }, [page, search])

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
    } catch (e) { console.log(e) }
    setLoading(false)
  }

  const totalPages = Math.ceil(total / pageSize)

  const getStatusBadge = (status) => {
    const map = {
      Approved: "bg-emerald-100 text-emerald-700 border-emerald-300",
      Rejected: "bg-red-100 text-red-700 border-red-300",
    }
    return map[status] || "bg-slate-100 text-slate-600 border-slate-300"
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-inner">
          <Mail className="text-emerald-700" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-950">Email History</h1>
          <p className="text-slate-500 text-sm">{total} emails sent</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text" placeholder="Search by patient, doctor, or email..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm text-slate-900"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100/50 p-16 text-center">
          <Mail className="mx-auto text-slate-300" size={64} />
          <h3 className="text-2xl font-bold text-emerald-950 mt-6">No Emails Sent Yet</h3>
          <p className="text-slate-500 mt-3">Approved or rejected requests will appear here after sending notification emails.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-emerald-100 bg-emerald-50/50">
                  <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Date</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Patient</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Doctor</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Procedure</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Sent To</th>
                  <th className="text-center py-4 px-6 font-bold text-slate-700 text-sm">Decision</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelected(log)}
                    className="border-b border-slate-100 hover:bg-emerald-50/50 transition-all cursor-pointer"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar size={14} />
                        {log.sent_at ? new Date(log.sent_at).toLocaleDateString() : "-"}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-900">{log.patient_name}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">{log.doctor_name || "-"}</td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm font-bold text-emerald-700">{log.procedure_code || "-"}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">{log.to_email}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`border px-3 py-1.5 rounded-full text-xs font-bold ${getStatusBadge(log.status)}`}>
                        {log.status}
                      </span>
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
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
            <div className="sticky top-0 bg-white border-b border-emerald-100 rounded-t-3xl flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Mail className="text-emerald-700" size={22} />
                <h2 className="text-xl font-bold text-emerald-950">Email Details</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-slate-100 transition-all">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <div className="flex items-center gap-2 mb-1">
                  <BadgeCheck size={16} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Subject</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{selected.subject}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={14} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Patient</span>
                  </div>
                  <p className="font-bold text-slate-900">{selected.patient_name}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope size={14} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Doctor</span>
                  </div>
                  <p className="font-bold text-slate-900">{selected.doctor_name || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Procedure</span>
                  </div>
                  <p className="font-bold text-slate-900">{selected.procedure_code || "-"}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Decision</span>
                  </div>
                  <span className={`border px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(selected.status)}`}>
                    {selected.status}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={14} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Recipient</span>
                </div>
                <p className="font-bold text-slate-900">{selected.to_email}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sent At</span>
                </div>
                <p className="font-bold text-slate-900">
                  {selected.sent_at ? new Date(selected.sent_at).toLocaleString() : "-"}
                </p>
              </div>

              {selected.request_id && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink size={14} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Request ID</span>
                  </div>
                  <p className="font-mono text-sm text-slate-900">{selected.request_id}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-emerald-100 rounded-b-3xl px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
