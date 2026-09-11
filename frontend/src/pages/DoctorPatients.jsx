import { useState, useEffect } from "react"
import { Search, Users, UserRound, Stethoscope, Calendar, Activity, ChevronLeft, ChevronRight } from "lucide-react"
import { getDoctorPatients } from "../services/api"

export default function DoctorPatients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15

  useEffect(() => {
    fetchPatients()
  }, [page, search])

  async function fetchPatients() {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize }
      if (search) params.search = search
      const res = await getDoctorPatients(params)
      const data = res.data
      setPatients(data.items || [])
      setTotal(data.total || 0)
    } catch (e) { console.log(e) }
    setLoading(false)
  }

  const totalPages = Math.ceil(total / pageSize)

  const getStatusColor = (status) => {
    if (status === "Approved") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
    if (status === "Pending") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
    if (status === "Rejected") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    if (status === "Manual Review") return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-100 to-sky-100 dark:from-cyan-900/60 dark:to-sky-900/60 dark:from-cyan-900/60 dark:to-sky-900/60 flex items-center justify-center shadow-inner">
            <Users className="text-cyan-700 dark:text-cyan-300" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-cyan-950 dark:text-white">My Patients</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{total} total patients</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
        <input
          type="text" placeholder="Search patients by name or ID..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-5 bg-white/70 dark:bg-slate-800/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm text-slate-900"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin" />
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-cyan-100/50 dark:border-slate-700 p-16 text-center">
          <UserRound className="mx-auto text-slate-300 dark:text-slate-600" size={64} />
          <h3 className="text-2xl font-bold text-cyan-950 dark:text-white mt-6">No Patients Found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-3">Patients will appear here once you submit authorization requests.</p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-cyan-100/50 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-100 bg-cyan-50/50 dark:bg-slate-800/60 dark:border-slate-700">
                  <th className="text-left py-4 px-6 font-bold text-slate-700 dark:text-slate-300 text-sm">Patient Name</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 dark:text-slate-300 text-sm">Patient ID</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 dark:text-slate-300 text-sm">Insurance</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 dark:text-slate-300 text-sm">Diagnosis</th>
                  <th className="text-center py-4 px-6 font-bold text-slate-700 dark:text-slate-300 text-sm">Requests</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 dark:text-slate-300 text-sm">Last Status</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 dark:text-slate-300 text-sm">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p, idx) => (
<tr key={p.patient_id || idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-cyan-50/30 dark:hover:bg-slate-800/40 transition-all">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-sky-100 dark:from-cyan-900/60 dark:to-sky-900/60 flex items-center justify-center">
                          <UserRound className="text-cyan-700 dark:text-cyan-300" size={18} />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">{p.patient_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-sm text-slate-600 dark:text-slate-400">{p.patient_id}</td>
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{p.insurance_provider || "-"}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400 text-sm max-w-[200px] truncate">{p.diagnosis || "-"}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 px-3 py-1 rounded-full text-sm font-bold">
                        {p.total_requests}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(p.last_status)}`}>
                        {p.last_status || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                      {p.last_request_date ? new Date(p.last_request_date).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-cyan-100 dark:border-slate-700 bg-cyan-50/30 dark:bg-slate-800/60">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl hover:bg-cyan-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <span className="text-sm font-bold text-cyan-950 dark:text-white px-3">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl hover:bg-cyan-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
