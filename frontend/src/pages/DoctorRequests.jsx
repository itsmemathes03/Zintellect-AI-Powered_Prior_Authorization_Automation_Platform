import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ClipboardList, Search, FileText, Calendar, ChevronLeft, ChevronRight, Plus, ArrowRight } from "lucide-react"

export default function DoctorRequests() {
  const navigate = useNavigate()
  const token = localStorage.getItem("access_token")
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/doctor/requests?${params}`, {
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-100 to-sky-100 flex items-center justify-center shadow-inner">
            <ClipboardList className="text-cyan-700" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-cyan-950">Authorization Requests</h1>
            <p className="text-slate-500 text-sm">{total} total requests</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/new-request")}
          className="flex items-center gap-3 bg-gradient-to-r from-cyan-700 to-sky-600 text-white px-6 py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl"
        >
          <Plus size={20} />
          New Request
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text" placeholder="Search by patient, diagnosis, or procedure..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm text-slate-900"
          />
        </div>
        <select
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="border border-slate-200 rounded-2xl py-4 px-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm text-slate-900"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s || "All Statuses"}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-cyan-100/50 p-16 text-center">
          <FileText className="mx-auto text-slate-300" size={64} />
          <h3 className="text-2xl font-bold text-cyan-950 mt-6">No Requests Found</h3>
          <p className="text-slate-500 mt-3">No authorization requests match your search criteria.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-cyan-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-100 bg-cyan-50/50">
                  <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Patient</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Procedure</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Diagnosis</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Insurance</th>
                  <th className="text-center py-4 px-6 font-bold text-slate-700 text-sm">Confidence</th>
                  <th className="text-center py-4 px-6 font-bold text-slate-700 text-sm">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-100 hover:bg-cyan-50/30 transition-all">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-900">{req.patient_name}</span>
                      <p className="text-xs text-slate-400 font-mono mt-1">{req.patient_id}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm font-bold text-cyan-700">{req.procedure_code}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 max-w-[200px] truncate">{req.diagnosis || "-"}</td>
                    <td className="py-4 px-6 text-sm text-slate-700">{req.insurance_provider}</td>
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-cyan-100 bg-cyan-50/30">
              <p className="text-sm text-slate-600">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl hover:bg-cyan-100 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={20} className="text-slate-600" />
                </button>
                <span className="text-sm font-bold text-cyan-950 px-3">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl hover:bg-cyan-100 disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={20} className="text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
