import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ClipboardList, Search, FileText, Calendar, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { getReviewQueue } from "../services/api"
import { toast, friendlyMessage } from "../services/toast"
import PageHeader from "../components/ui/PageHeader"
import Card from "../components/ui/Card"
import StatusBadge from "../components/ui/StatusBadge"
import Badge from "../components/ui/Badge"
import EmptyState from "../components/ui/EmptyState"
import DataTable from "../components/ui/DataTable"
import Button from "../components/ui/Button"

export default function ReviewQueue() {
  const navigate = useNavigate()
  const token = localStorage.getItem("access_token")
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15

  useEffect(() => {
    fetchQueue()
  }, [page, search])

  async function fetchQueue() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, page_size: pageSize })
      if (search) params.append("search", search)
      const res = await getReviewQueue({ params })
      setItems(res.items || [])
      setTotal(res.total || 0)
    } catch (e) {
      toast.error(friendlyMessage(e))
    }
    setLoading(false)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const getMissingCount = (missing) => {
    if (!missing) return 0
    return missing.split("\n").filter((line) => line.trim()).length
  }

  const confidenceColor = (score) => {
    if (score == null) return "text-slate-400"
    if (score >= 0.8) return "text-success-600 dark:text-success-500"
    if (score >= 0.5) return "text-warning-600 dark:text-warning-500"
    return "text-danger-600 dark:text-danger-500"
  }

  const columns = [
    {
      header: "Patient",
      width: "18%",
      render: (item) => <span className="font-semibold text-slate-900 dark:text-white">{item.patient_name}</span>,
    },
    {
      header: "Procedure",
      render: (item) => <span className="font-mono text-sm font-bold text-brand-700 dark:text-brand-400">{item.procedure_code}</span>,
    },
    {
      header: "Diagnosis",
      cellClassName: "max-w-[200px]",
      render: (item) => <span className="text-sm text-slate-600 dark:text-slate-400 truncate block">{item.diagnosis || "—"}</span>,
    },
    {
      header: "AI Recommendation",
      render: (item) => <StatusBadge status={item.ai_recommendation} />,
    },
    {
      header: "Confidence",
      render: (item) => (
        <span className={`font-bold text-sm ${confidenceColor(item.confidence_score)}`}>
          {item.confidence_score != null ? `${(item.confidence_score * 100).toFixed(0)}%` : "—"}
        </span>
      ),
    },
    {
      header: "Missing Docs",
      render: (item) => {
        const count = getMissingCount(item.missing_documents)
        return count > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-warning-700 dark:text-warning-500 font-bold text-sm">
            <AlertTriangle size={14} /> {count}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-success-600 dark:text-success-500 font-bold text-sm">
            <CheckCircle2 size={14} /> None
          </span>
        )
      },
    },
    {
      header: "Submitted",
      render: (item) => (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Calendar size={14} />
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
        </div>
      ),
    },
    {
      className: "text-center",
      render: (item) => (
        <Button size="sm" onClick={() => navigate(`/provider-dashboard/review/${item.id}`)}>
          <FileText size={14} /> Review
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Queue"
        description={`${total} requests awaiting human review`}
        icon={ClipboardList}
      />

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="input-field pl-10"
        />
      </div>

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No Requests Awaiting Review"
          description="All requests have been reviewed or no requests are pending."
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyMessage="No requests match your search."
          onRowClick={(item) => navigate(`/provider-dashboard/review/${item.id}`)}
        />
      )}

      {!loading && items.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </Button>
            <Badge color="gray" className="px-3 py-1.5 tabular-nums">
              Page {page} of {totalPages}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}