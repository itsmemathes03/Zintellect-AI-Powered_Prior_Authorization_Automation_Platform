import { useState, useEffect, useCallback } from "react"
import {
  Clock, Search, Filter, Download, Loader, Activity, User, FileText, Shield,
  CheckCircle2, XCircle, AlertTriangle, History
} from "lucide-react"
import { getAdminAudit } from "../services/api"
import AdminTable from "../components/AdminTable"
import { useToast } from "../components/Toast"
import Papa from "papaparse"

export default function AdminAudit() {
  const { addToast } = useToast()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("")

  const columns = [
    { key: "timestamp", label: "Timestamp", sortable: true },
    { key: "action", label: "Action", sortable: true },
    { key: "description", label: "Description" },
    { key: "user_id", label: "User" },
    { key: "role", label: "Role" },
    { key: "request_id", label: "Request ID" },
    { key: "status", label: "Status" },
  ]

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize }
      if (search) params.search = search
      if (actionFilter) params.action = actionFilter
      const res = await getAdminAudit(params)
      setLogs(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      addToast("Failed to load audit logs", "error")
    }
    setLoading(false)
  }, [page, pageSize, search, actionFilter, addToast])

  useEffect(() => { loadLogs() }, [loadLogs])

  const exportCSV = () => {
    const data = logs.map((log) => ({
      timestamp: log.created_at ? new Date(log.created_at).toLocaleString() : "",
      action: log.action, description: log.description,
      user_id: log.user_id, role: log.role,
      request_id: log.request_id || "", status: log.status,
    }))
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "audit-log.csv"
    link.click()
    URL.revokeObjectURL(link.href)
    addToast("CSV exported successfully", "success")
  }

  const getActionIcon = (action) => {
    if (!action) return Activity
    if (action.includes("CREATED")) return FileText
    if (action.includes("UPDATED")) return User
    if (action.includes("DEACTIVATED")) return XCircle
    if (action.includes("POLICY")) return Shield
    if (action.includes("approved") || action.includes("APPROVED")) return CheckCircle2
    if (action.includes("rejected") || action.includes("REJECTED")) return XCircle
    return Activity
  }

  const formatDate = (d) => {
    if (!d) return "-"
    return new Date(d).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">Audit Trail</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Full system-wide audit log with search and filtering</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-blue-100 dark:border-slate-700 px-5 py-2.5 rounded-2xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
            className="pl-10 pr-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Actions</option>
            <option value="USER_CREATED">User Created</option>
            <option value="USER_UPDATED">User Updated</option>
            <option value="USER_DEACTIVATED">User Deactivated</option>
            <option value="POLICY_STATUS_CHANGED">Policy Status Changed</option>
          </select>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={logs}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        onSearch={(val) => { setSearch(val); setPage(1) }}
        searchPlaceholder="Search by description, user ID, or request ID..."
        emptyMessage="No audit logs found"
        renderRow={(log) => {
          const ActionIcon = getActionIcon(log.action)
          return (
            <>
              <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(log.created_at)}</td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    log.action?.includes("CREATED") ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                    log.action?.includes("UPDATED") ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                    log.action?.includes("DEACTIVATED") ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                    log.action?.includes("POLICY") ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                    "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}>
                    <ActionIcon size={16} />
                  </div>
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">{log.action || "—"}</span>
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">{log.description || "—"}</td>
              <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{log.user_id ? log.user_id.substring(0, 8) + "..." : "—"}</td>
              <td className="px-4 py-4">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                  log.role === "Admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                  log.role === "Provider" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                  log.role === "Doctor" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                  "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}>{log.role || "—"}</span>
              </td>
              <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{log.request_id ? log.request_id.substring(0, 8) + "..." : "—"}</td>
              <td className="px-4 py-4">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  log.status === "Success" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                  log.status === "Failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                  "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}>
                  {log.status === "Success" && <CheckCircle2 size={12} />}
                  {log.status === "Failed" && <XCircle size={12} />}
                  {log.status || "—"}
                </span>
              </td>
            </>
          )
        }}
      />
    </div>
  )
}
