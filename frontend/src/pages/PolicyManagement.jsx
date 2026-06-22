import { useState, useEffect, useCallback } from "react"
import {
  FileText, CheckCircle2, XCircle, Clock, Loader, Search, Filter, MessageSquare, Eye, Shield
} from "lucide-react"
import { getAdminPolicies, updatePolicyStatus } from "../services/api"
import AdminTable from "../components/AdminTable"
import { useToast } from "../components/Toast"

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

  const columns = [
    { key: "procedure_name", label: "Procedure", sortable: true },
    { key: "insurance_provider", label: "Provider", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "version", label: "Version" },
    { key: "created_at", label: "Uploaded", sortable: true },
    { key: "actions", label: "Actions" },
  ]

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

  const handleAction = async (status) => {
    if (!actionModal) return
    setActionLoading(true)
    try {
      await updatePolicyStatus(actionModal.id, { status, comment: comment || undefined })
      addToast(`Policy ${status} successfully`, "success")
      setActionModal(null)
      setComment("")
      loadPolicies()
    } catch (err) {
      addToast(err.response?.data?.detail || "Action failed", "error")
    }
    setActionLoading(false)
  }

  const getStatusBadge = (status) => {
    const configs = {
      approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    }
    return configs[status] || "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
  }

  const formatDate = (d) => {
    if (!d) return "-"
    return new Date(d).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">Policy Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Review and approve/reject insurance policies</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="pl-10 pr-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={policies}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        onSearch={(val) => { setSearch(val); setPage(1) }}
        searchPlaceholder="Search by procedure or provider..."
        emptyMessage="No policies found"
        renderRow={(policy) => (
          <>
            <td className="px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <FileText className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white capitalize">{policy.procedure_name}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{policy.insurance_provider}</td>
            <td className="px-4 py-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(policy.status)}`}>
                {policy.status === "approved" && <CheckCircle2 size={12} />}
                {policy.status === "rejected" && <XCircle size={12} />}
                {policy.status === "pending" && <Clock size={12} />}
                {policy.status}
              </span>
            </td>
            <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{policy.version || "1.0"}</td>
            <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{formatDate(policy.created_at)}</td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-2">
                {policy.policy_text && (
                  <button onClick={() => setPreviewPolicy(policy)}
                    className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-all hover:scale-110"
                    title="Preview">
                    <Eye size={16} />
                  </button>
                )}
                {policy.status === "pending" && (
                  <>
                    <button onClick={() => setActionModal(policy)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-200 transition-all hover:scale-105">
                      Approve
                    </button>
                    <button onClick={() => { setActionModal(policy); setComment("") }}
                      className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-bold hover:bg-red-200 transition-all hover:scale-105">
                      Reject
                    </button>
                  </>
                )}
              </div>
            </td>
          </>
        )}
      />

      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-blue-100 dark:border-slate-700 w-full max-w-md p-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 mx-auto">
              <Shield className="text-white" size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Review Policy</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-4">
              <strong className="text-slate-700 dark:text-slate-300">{actionModal.procedure_name}</strong> from <strong className="text-slate-700 dark:text-slate-300">{actionModal.insurance_provider}</strong>
            </p>
            {actionModal.rejection_comment && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
                <p className="text-xs text-amber-700 dark:text-amber-300"><strong>Previous comment:</strong> {actionModal.rejection_comment}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Comment (optional)</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none"
                placeholder="Add a comment about this decision..." />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setActionModal(null)}
                className="px-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleAction("rejected")} disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg">
                <XCircle size={16} />
                Reject
              </button>
              <button onClick={() => handleAction("approved")} disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg">
                <CheckCircle2 size={16} />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {previewPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-blue-100 dark:border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-blue-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                <FileText className="text-blue-600" size={20} />
                {previewPolicy.procedure_name}
              </h2>
              <button onClick={() => setPreviewPolicy(null)} className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
                <XCircle size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3"><span className="font-semibold text-slate-500">Provider:</span> <span className="text-slate-900 dark:text-white ml-1">{previewPolicy.insurance_provider}</span></div>
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3"><span className="font-semibold text-slate-500">Status:</span> <span className={`font-bold ml-1 ${previewPolicy.status === "approved" ? "text-emerald-600" : previewPolicy.status === "rejected" ? "text-red-600" : "text-amber-600"}`}>{previewPolicy.status}</span></div>
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3"><span className="font-semibold text-slate-500">Version:</span> <span className="text-slate-900 dark:text-white ml-1">{previewPolicy.version || "1.0"}</span></div>
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3"><span className="font-semibold text-slate-500">Uploaded:</span> <span className="text-slate-900 dark:text-white ml-1">{formatDate(previewPolicy.created_at)}</span></div>
              </div>
              {previewPolicy.rejection_comment && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-4">
                  <p className="font-semibold text-red-700 dark:text-red-300 text-sm">Rejection Comment:</p>
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{previewPolicy.rejection_comment}</p>
                </div>
              )}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  Policy Text
                </h3>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 max-h-64 overflow-y-auto border border-blue-50 dark:border-slate-700">
                  <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{previewPolicy.policy_text || "No text available"}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
