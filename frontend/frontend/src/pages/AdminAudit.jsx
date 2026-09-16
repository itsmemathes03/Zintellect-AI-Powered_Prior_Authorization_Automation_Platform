import { useState, useEffect, useCallback } from "react"
import {
  Clock, Search, Filter, Download, Activity, FileText, Shield,
  CheckCircle2, XCircle, History, User, ChevronLeft, ChevronRight
} from "lucide-react"
import { getAdminAudit } from "../services/api"
import { useToast } from "../components/Toast"
import Papa from "papaparse"
import PageHeader from "../components/ui/PageHeader"
import Badge from "../components/ui/Badge"
import DataTable from "../components/ui/DataTable"
import Button from "../components/ui/Button"

const roleColor = {
  Admin: "purple",
  Provider: "green",
  Doctor: "blue",
  Patient: "amber",
}

export default function AdminAudit() {
  const { addToast } = useToast()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("")

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

  const getActionMeta = (action) => {
    if (!action) return { icon: Activity, color: "gray" }
    if (action.includes("CREATED")) return { icon: User, color: "blue" }
    if (action.includes("UPDATED")) return { icon: User, color: "purple" }
    if (action.includes("DEACTIVATED")) return { icon: XCircle, color: "red" }
    if (action.includes("POLICY")) return { icon: Shield, color: "amber" }
    if (action.includes("approved") || action.includes("APPROVED")) return { icon: CheckCircle2, color: "green" }
    if (action.includes("rejected") || action.includes("REJECTED")) return { icon: XCircle, color: "red" }
    if (action.includes("review") || action.includes("REVIEW")) return { icon: FileText, color: "blue" }
    return { icon: Activity, color: "gray" }
  }

  const formatDate = (d) => {
    if (!d) return "—"
    return new Date(d).toLocaleString()
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const columns = [
    {
      header: "Timestamp",
      width: "16%",
      render: (log) => <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(log.created_at)}</span>,
    },
    {
      header: "Action",
      width: "18%",
      render: (log) => {
        const { icon: ActionIcon, color } = getActionMeta(log.action)
        const colorMap = {
          blue: "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400",
          purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
          red: "bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500",
          amber: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500",
          green: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500",
          gray: "bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-400",
        }
        return (
          <div className="flex items-center gap-2">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
              <ActionIcon size={16} />
            </span>
            <span className="font-semibold text-sm text-slate-900 dark:text-white">{log.action || "—"}</span>
          </div>
        )
      },
    },
    {
      header: "Description",
      width: "24%",
      render: (log) => <span className="text-sm text-slate-600 dark:text-slate-400 block max-w-xs truncate">{log.description || "—"}</span>,
    },
    {
      header: "User",
      render: (log) => <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">{log.user_id ? `${log.user_id.substring(0, 8)}...` : "—"}</span>,
    },
    {
      header: "Role",
      render: (log) => <Badge color={roleColor[log.role] || "gray"}>{log.role || "—"}</Badge>,
    },
    {
      header: "Request ID",
      render: (log) => <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">{log.request_id ? `${log.request_id.substring(0, 8)}...` : "—"}</span>,
    },
    {
      header: "Status",
      render: (log) => (
        <Badge color={log.status === "Success" ? "green" : log.status === "Failed" ? "red" : "gray"} dot>
          {log.status || "—"}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail"
        description="Full system-wide audit log with search and filtering"
        icon={History}
        actions={[
          <Button key="export" variant="secondary" onClick={exportCSV}>
            <Download size={16} /> Export CSV
          </Button>,
        ]}
      />

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
            className="input-field pl-9"
          >
            <option value="">All Actions</option>
            <option value="USER_CREATED">User Created</option>
            <option value="USER_UPDATED">User Updated</option>
            <option value="USER_DEACTIVATED">User Deactivated</option>
            <option value="POLICY_STATUS_CHANGED">Policy Status Changed</option>
          </select>
        </div>
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by description, user ID, or request ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="input-field"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        emptyMessage="No audit logs found"
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
    </div>
  )
}