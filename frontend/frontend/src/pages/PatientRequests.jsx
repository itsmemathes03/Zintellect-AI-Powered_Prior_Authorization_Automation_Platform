import { useState, useEffect } from "react"
import { ClipboardList, Search, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "../components/Toast"
import PageHeader from "../components/ui/PageHeader"
import Badge from "../components/ui/Badge"
import DataTable from "../components/ui/DataTable"
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

export default function PatientRequests() {
  const token = localStorage.getItem("access_token")
  const { addToast } = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15

  useEffect(() => { fetchRequests() }, [page, search])

  async function fetchRequests() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, page_size: pageSize })
      if (search) params.append("search", search)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/patient/requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setRequests(data.items || [])
      setTotal(data.total || 0)
    } catch (e) { console.log(e); addToast("Failed to load requests", "error") }
    setLoading(false)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const columns = [
    {
      header: "Procedure",
      width: "16%",
      render: (req) => <span className="font-mono text-sm font-bold text-brand-700 dark:text-brand-400">{req.procedure_code}</span>,
    },
    { header: "Diagnosis", cellClassName: "max-w-[200px]", render: (req) => <span className="text-sm text-slate-600 dark:text-slate-400 block truncate">{req.diagnosis || "-"}</span> },
    { header: "Insurance", render: (req) => <span className="text-sm text-slate-700 dark:text-slate-300">{req.insurance_provider}</span> },
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
    <div className="space-y-6">
      <PageHeader
        title="My Authorization Requests"
        description={`${total} total requests`}
        icon={ClipboardList}
      />

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search requests..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="input-field pl-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={requests}
        loading={loading}
        emptyMessage="No requests found yet"
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
    </div>
  )
}