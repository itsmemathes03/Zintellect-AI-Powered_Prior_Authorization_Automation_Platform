import { useState, useEffect, useCallback } from "react"
import {
  FileText, CheckCircle2, XCircle, Clock, Filter, Eye, Shield, Calendar,
  ChevronLeft, ChevronRight
} from "lucide-react"
import { getAdminPolicies, updatePolicyStatus } from "../services/api"
import { useToast } from "../components/Toast"
import PageHeader from "../components/ui/PageHeader"
import Badge from "../components/ui/Badge"
import DataTable from "../components/ui/DataTable"
import Modal from "../components/ui/Modal"
import Button from "../components/ui/Button"

const statusColor = {
  approved: "green",
  rejected: "red",
  pending: "amber",
}

const statusIcon = (status) => {
  if (status === "approved") return <CheckCircle2 size={12} />
  if (status === "rejected") return <XCircle size={12} />
  if (status === "pending") return <Clock size={12} />
  return null
}

export default function PolicyManagement() {
  const { addToast } = useToast()
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [actionModal, setActionModal] = useState(null)
  const [comment, setComment] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [previewPolicy, setPreviewPolicy] = useState(null)

  const loadPolicies = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize }
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const res = await getAdminPolicies(params)
      setPolicies(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      addToast("Failed to load policies", "error")
    }
    setLoading(false)
  }, [page, pageSize, search, statusFilter, addToast])

  useEffect(() => { loadPolicies() }, [loadPolicies])

  const openActionModal = (policy, resetComment = false) => {
    setActionModal(policy)
    if (resetComment) setComment("")
  }

  const handleAction = async (status, text = comment) => {
    if (!actionModal) return
    setActionLoading(true)
    try {
      await updatePolicyStatus(actionModal.id, { status, comment: text || undefined })
      addToast(`Policy ${status} successfully`, "success")
      setActionModal(null)
      setComment("")
      loadPolicies()
    } catch (err) {
      addToast(err.response?.data?.detail || "Action failed", "error")
    }
    setActionLoading(false)
  }

  const formatDate = (d) => {
    if (!d) return "-"
    return new Date(d).toLocaleDateString()
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const columns = [
    {
      header: "Procedure",
      width: "22%",
      render: (policy) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0 ring-1 ring-brand-600/10">
            <FileText size={16} className="text-brand-600 dark:text-brand-400" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white capitalize">{policy.procedure_name}</span>
        </div>
      ),
    },
    { header: "Provider", render: (policy) => <span className="text-slate-600 dark:text-slate-400">{policy.insurance_provider}</span> },
    {
      header: "Status",
      render: (policy) => (
        <Badge color={statusColor[policy.status] || "gray"} className="capitalize">
          {statusIcon(policy.status)}
          {policy.status}
        </Badge>
      ),
    },
    { header: "Version", render: (policy) => <span className="text-slate-600 dark:text-slate-400">{policy.version || "1.0"}</span> },
    { header: "Uploaded", render: (policy) => <span className="text-slate-600 dark:text-slate-400">{formatDate(policy.created_at)}</span> },
    {
      className: "text-right",
      cellClassName: "text-right",
      render: (policy) => (
        <div className="flex items-center justify-end gap-2">
          {policy.policy_text && (
            <button
              onClick={() => setPreviewPolicy(policy)}
              className="p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-600 dark:text-brand-400 transition-colors"
              title="Preview"
              aria-label="Preview policy"
            >
              <Eye size={16} />
            </button>
          )}
          {policy.status === "pending" && (
            <>
              <Button size="sm" onClick={() => openActionModal(policy)}>Approve</Button>
              <Button size="sm" variant="danger" onClick={() => openActionModal(policy, true)}>Reject</Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policy Management"
        description="Review and approve or reject insurance policies"
        icon={Shield}
      />

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="input-field pl-9"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by procedure or provider..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="input-field"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={policies}
        loading={loading}
        emptyMessage="No policies found"
      />

      {!loading && policies.length > 0 && totalPages > 1 && (
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

      <Modal open={!!actionModal} onClose={() => setActionModal(null)} title="Review Policy" size="md">
        {actionModal && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0 ring-1 ring-brand-600/10">
                <Shield size={20} className="text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white capitalize">{actionModal.procedure_name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{actionModal.insurance_provider}</p>
              </div>
            </div>

            {actionModal.rejection_comment && (
              <div className="bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-800 rounded-lg p-3">
                <p className="text-xs text-warning-800 dark:text-warning-500"><strong>Previous comment:</strong> {actionModal.rejection_comment}</p>
              </div>
            )}

            <div>
              <label className="label">Comment (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="Add a comment about this decision..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
              <Button variant="secondary" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleAction("rejected")} disabled={actionLoading} loading={actionLoading}>
                <XCircle size={16} /> Reject
              </Button>
              <Button variant="success" onClick={() => handleAction("approved")} disabled={actionLoading} loading={actionLoading}>
                <CheckCircle2 size={16} /> Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!previewPolicy} onClose={() => setPreviewPolicy(null)} title={previewPolicy?.procedure_name} size="lg">
        {previewPolicy && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Provider</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{previewPolicy.insurance_provider}</p>
              </div>
              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status</p>
                <p className="mt-0.5"><Badge color={statusColor[previewPolicy.status] || "gray"}>{previewPolicy.status}</Badge></p>
              </div>
              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Version</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{previewPolicy.version || "1.0"}</p>
              </div>
              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5"><Calendar size={12} /> Uploaded</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{formatDate(previewPolicy.created_at)}</p>
              </div>
            </div>

            {previewPolicy.rejection_comment && (
              <div className="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
                <p className="font-semibold text-danger-700 dark:text-danger-500 text-sm">Rejection Comment:</p>
                <p className="text-danger-600 dark:text-danger-400 text-sm mt-1">{previewPolicy.rejection_comment}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2 text-sm">
                <FileText size={16} className="text-brand-600" /> Policy Text
              </h3>
              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-lg p-4 max-h-64 overflow-y-auto border border-slate-100 dark:border-navy-700">
                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{previewPolicy.policy_text || "No text available"}</pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}