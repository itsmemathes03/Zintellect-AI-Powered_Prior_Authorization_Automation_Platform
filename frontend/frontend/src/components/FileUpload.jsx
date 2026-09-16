import { useState, useRef } from "react"
import { toast } from "../services/toast"
import { UploadCloud, FileText, Trash2, CheckCircle2, AlertCircle, BrainCircuit, ShieldCheck } from "lucide-react"

const ALLOWED_MIMES = ["application/pdf", "text/plain"]
const ALLOWED_EXTS = [".pdf", ".txt"]

export default function FileUpload({ setFiles }) {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)

  const processFiles = (uploadedFiles) => {
    const validFiles = uploadedFiles.filter((file) => {
      const ext = "." + file.name.split(".").pop().toLowerCase()
      return ALLOWED_MIMES.includes(file.type) || ALLOWED_EXTS.includes(ext)
    })

    if (validFiles.length !== uploadedFiles.length) {
      toast.warning("Only PDF and TXT files allowed")
    }

    const updatedFiles = [...selectedFiles, ...validFiles]

    if (updatedFiles.length > 5) {
      toast.warning("Maximum 5 files allowed")
      return
    }

    setSelectedFiles(updatedFiles)
    setFiles(updatedFiles)
  }

  const handleFiles = (e) => {
    const uploadedFiles = Array.from(e.target.files)
    processFiles(uploadedFiles)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const uploadedFiles = Array.from(e.dataTransfer.files)
    processFiles(uploadedFiles)
  }

  const removeFile = (indexToRemove) => {
    const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove)
    setSelectedFiles(updatedFiles)
    setFiles(updatedFiles)
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (file) => {
    const ext = file.name.split(".").pop().toLowerCase()
    if (ext === "txt") return <FileText size={18} className="text-teal-600" />
    return <FileText size={18} className="text-brand-600" />
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 dark:bg-navy-900 dark:border-navy-800">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
            <UploadCloud size={20} className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Medical Documents</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Upload clinical documents for AI analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">Files selected:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-navy-800 rounded-lg px-3 py-2">
            <span className="text-lg font-bold text-slate-900 dark:text-white">{selectedFiles.length}</span>
            <span className="text-sm text-slate-400">/5</span>
          </div>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files - drop files or click to browse"
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current.click() }}
        onClick={() => fileInputRef.current.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
          dragging
            ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
            : "border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/50 hover:bg-slate-100 dark:hover:bg-navy-800"
        }`}
      >
        <div className="w-12 h-12 rounded-lg bg-white dark:bg-navy-900 shadow-card border border-slate-200 dark:border-navy-700 flex items-center justify-center mx-auto mb-3">
          <UploadCloud size={22} className="text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {dragging ? "Drop files here" : "Drop files or click to browse"}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          PDF, TXT — Max 5 files
        </p>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); fileInputRef.current.click() }}
          className="mt-4 inline-flex items-center gap-2 bg-brand-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-800 transition-colors shadow-sm"
        >
          <UploadCloud size={14} />
          Browse Files
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.PDF,.TXT,application/pdf,text/plain"
          onChange={handleFiles}
          className="hidden"
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-success-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Uploaded Files</h3>
          </div>

          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-slate-50 dark:bg-navy-800/50 border border-slate-200 dark:border-navy-700 rounded-lg px-4 py-3 hover:border-slate-300 dark:hover:border-navy-600 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 flex items-center justify-center flex-shrink-0">
                  {getFileIcon(file)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatSize(file.size)}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600 dark:text-success-500 flex-shrink-0">
                  <CheckCircle2 size={12} /> Ready
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-danger-600 dark:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors flex-shrink-0"
                  aria-label={`Remove ${file.name}`}
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/40 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={16} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upload Requirements</h3>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <li>• Minimum 3 documents required</li>
            <li>• Maximum 5 files allowed</li>
            <li>• PDF and TXT documents supported</li>
            <li>• AI-ready healthcare evidence</li>
          </ul>
        </div>

        <div className="bg-navy-950 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit size={16} className="text-teal-400" />
            <h3 className="text-sm font-semibold text-white">AI Processing Pipeline</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <p className="text-xs text-slate-300">OCR Clinical Extraction</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <p className="text-xs text-slate-300">Medical Entity Recognition</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              <p className="text-xs text-slate-300">Insurance Policy Matching</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-warning-400" />
              <p className="text-xs text-slate-300">Authorization Decision Engine</p>
            </div>
          </div>
        </div>
      </div>

      {selectedFiles.length < 3 && selectedFiles.length > 0 && (
        <div className="mt-4 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-800 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-warning-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-warning-800 dark:text-warning-500">Minimum 3 documents required</p>
            <p className="text-xs text-warning-700 dark:text-warning-600 mt-0.5">
              Upload {3 - selectedFiles.length} more healthcare document{3 - selectedFiles.length !== 1 ? "s" : ""} before submission.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}