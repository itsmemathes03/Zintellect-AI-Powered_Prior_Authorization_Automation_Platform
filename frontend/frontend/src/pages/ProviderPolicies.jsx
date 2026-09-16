import { useState, useEffect } from "react"
import { FileText, Upload, Trash2, Search, Eye, ShieldCheck, Building2 } from "lucide-react"
import { uploadPolicy, getPolicies, deletePolicy } from "../services/policyService"
import { useToast } from "../components/Toast"
import PageHeader from "../components/ui/PageHeader"
import DataTable from "../components/ui/DataTable"
import Modal from "../components/ui/Modal"
import ConfirmationDialog from "../components/ui/ConfirmationDialog"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"

export default function ProviderPolicies() {
  const providerId = localStorage.getItem("provider_id")
  const providerName = localStorage.getItem("provider_name") || ""
  const { addToast } = useToast()

  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    procedureName: "",
    insuranceProvider: providerName,
    file: null,
  })
  const [fileName, setFileName] = useState("")

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { loadPolicies() }, [])

  async function loadPolicies() {
    setLoading(true)
    try {
      const res = await getPolicies(providerId)
      const data = res.data
      if (data.status === "Success") {
        setPolicies(data.policies || [])
      } else {
        setPolicies([])
      }
    } catch (e) {
      console.log(e)
      addToast("Failed to load policies", "error")
      setPolicies([])
    }
    setLoading(false)
  }

  const filteredPolicies = policies.filter((p) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      (p.procedure_name || "").toLowerCase().includes(term) ||
      (p.insurance_provider || "").toLowerCase().includes(term) ||
      (p.policy_id || "").toLowerCase().includes(term)
    )
  })

  const handleUploadChange = (e) => {
    const { name, value } = e.target
    setUploadForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== "application/pdf") {
        addToast("Only PDF files are accepted", "error")
        return
      }
      setUploadForm((prev) => ({ ...prev, file }))
      setFileName(file.name)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    if (!uploadForm.procedureName.trim()) {
      addToast("Procedure name is required", "error")
      return
    }
    if (!uploadForm.insuranceProvider.trim()) {
      addToast("Insurance provider name is required", "error")
      return
    }
    if (!uploadForm.file) {
      addToast("Please select a PDF file to upload", "error")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("providerId", providerId)
      formData.append("insuranceProvider", uploadForm.insuranceProvider.trim())
      formData.append("procedureName", uploadForm.procedureName.trim())
      formData.append("file", uploadForm.file)

      const res = await uploadPolicy(formData)
      const data = res.data

      if (data.status === "Success") {
        addToast("Policy uploaded successfully", "success")
        setShowUpload(false)
        setUploadForm({ procedureName: "", insuranceProvider: providerName, file: null })
        setFileName("")
        loadPolicies()
      } else {
        addToast(data.message || "Upload failed", "error")
      }
    } catch (err) {
      console.log(err)
      addToast(err.response?.data?.detail || "Upload failed", "error")
    }
    setUploading(false)
  }

  const resetUploadForm = () => {
    setUploadForm({ procedureName: "", insuranceProvider: providerName, file: null })
    setFileName("")
    setShowUpload(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await deletePolicy(deleteTarget.policy_id)
      const data = res.data
      if (data.status === "Success") {
        addToast("Policy deleted successfully", "success")
        setDeleteTarget(null)
        loadPolicies()
      } else {
        addToast(data.message || "Delete failed", "error")
      }
    } catch (err) {
      console.log(err)
      addToast(err.response?.data?.detail || "Delete failed", "error")
    }
    setDeleting(false)
  }

  const handleViewPdf = (policyId) => {
    const token = localStorage.getItem("access_token")
    const url = `${import.meta.env.VITE_API_URL}/policy-file/${policyId}`
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Download failed")
        return res.blob()
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob)
        window.open(blobUrl, "_blank")
      })
      .catch((err) => {
        console.log(err)
        addToast("Failed to download policy file", "error")
      })
  }

  const columns = [
    {
      header: "Procedure",
      width: "30%",
      render: (policy) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0 ring-1 ring-brand-600/10">
            <FileText size={16} className="text-brand-600 dark:text-brand-400" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white capitalize">{policy.procedure_name || "-"}</span>
        </div>
      ),
    },
    { header: "Insurance Provider", render: (policy) => <span className="text-slate-600 dark:text-slate-400">{policy.insurance_provider || "-"}</span> },
    { header: "Policy ID", render: (policy) => <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{policy.policy_id ? `${policy.policy_id.substring(0, 12)}...` : "-"}</span> },
    {
      className: "text-right",
      cellClassName: "text-right",
      render: (policy) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleViewPdf(policy.policy_id)}
            className="p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-600 dark:text-brand-400 transition-colors"
            title="View PDF"
            aria-label="View policy PDF"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => setDeleteTarget(policy)}
            className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-500/10 text-danger-600 dark:text-danger-500 transition-colors"
            title="Delete policy"
            aria-label="Delete policy"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insurance Policies"
        description={`${policies.length} total policies`}
        icon={ShieldCheck}
        actions={[
          <Button key="upload" onClick={() => setShowUpload(true)}>
            <Upload size={16} /> Upload Policy
          </Button>,
        ]}
      />

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by procedure, provider, or policy ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {policies.length === 0 && !loading ? (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-16 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mx-auto">
            <FileText size={32} className="text-brand-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-6">No Policies Yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
            Upload your first insurance policy PDF to get started.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-6 inline-flex items-center gap-2 btn btn-brand"
          >
            <Upload size={16} /> Upload Policy
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredPolicies}
          loading={loading}
          emptyMessage={search ? "No policies match your search criteria." : "No policies found"}
        />
      )}

      <Modal open={showUpload} onClose={resetUploadForm} title="Upload Policy" size="md">
        <form onSubmit={handleUpload} className="space-y-5">
          <div>
            <label className="label">Procedure Name <span className="text-danger-500">*</span></label>
            <input
              type="text"
              name="procedureName"
              value={uploadForm.procedureName}
              onChange={handleUploadChange}
              placeholder="e.g. MRI Brain Scan"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="label">Insurance Provider <span className="text-danger-500">*</span></label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="insuranceProvider"
                value={uploadForm.insuranceProvider}
                onChange={handleUploadChange}
                placeholder="e.g. HealthShield Insurance"
                className="input-field pl-9"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Policy PDF <span className="text-danger-500">*</span></label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="policy-file-input"
                required
              />
              <label
                htmlFor="policy-file-input"
                className="flex items-center gap-3 w-full border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-xl py-4 px-4 bg-slate-50 dark:bg-navy-800/50 hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all cursor-pointer"
              >
                <FileText size={20} className={fileName ? "text-brand-600" : "text-slate-400"} />
                <span className={fileName ? "text-sm font-medium text-slate-900 dark:text-white" : "text-sm text-slate-400"}>
                  {fileName || "Choose a PDF file..."}
                </span>
              </label>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Accepted format: PDF only</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={resetUploadForm}>Cancel</Button>
            <Button type="submit" disabled={uploading} loading={uploading}>
              <Upload size={16} /> {uploading ? "Uploading..." : "Upload Policy"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Policy"
        message="Are you sure you want to delete this policy?"
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}