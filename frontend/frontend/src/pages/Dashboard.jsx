import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import {
  Brain, CheckCircle2, UploadCloud, BadgeCheck,
  ArrowLeft, ArrowRight, FileText, UserRound, Stethoscope,
  AlertTriangle, Search, Loader2
} from "lucide-react"
import { toast, friendlyMessage } from "../services/toast"
import FileUpload from "../components/FileUpload"
import StatusCard from "../components/StatusCard"
import UrgencyIndicator from "../components/UrgencyIndicator"
import DocumentSimilarityCheck from "../components/DocumentSimilarityCheck"
import Card, { CardHeader, CardTitle } from "../components/ui/Card"
import Button from "../components/ui/Button"

const STEPS = [
  { id: "patient", label: "Patient Info", icon: UserRound },
  { id: "urgency", label: "Urgency & Match", icon: AlertTriangle },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "submit", label: "Review & Submit", icon: UploadCloud },
]

const URGENCY_STYLES = {
  critical: { active: "bg-danger-600 border-danger-600 text-white shadow-md shadow-danger-600/30", ring: "" },
  high: { active: "bg-warning-600 border-warning-600 text-white shadow-md shadow-warning-600/30", ring: "" },
  medium: { active: "bg-brand-700 border-brand-700 text-white shadow-md shadow-brand-700/30", ring: "" },
  low: { active: "bg-success-600 border-success-600 text-white shadow-md shadow-success-600/30", ring: "" },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    patientName: "", patientId: "", diagnosis: "",
    procedureCode: "", doctorName: "", insuranceProvider: "", insuranceId: "",
  })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [currentStage, setCurrentStage] = useState("")
  const [providers, setProviders] = useState([])
  const [urgencyLevel, setUrgencyLevel] = useState("medium")
  const [showSimilarityCheck, setShowSimilarityCheck] = useState(false)
  const [similarityConfirmed, setSimilarityConfirmed] = useState(false)

  async function fetchProviders() {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/providers`)
      setProviders(response.data.providers || [])
    } catch (error) { toast.error(friendlyMessage(error)) }
  }

  useEffect(() => { fetchProviders() }, [])

  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState("")
  const lookupTimer = useRef(null)

  const handlePatientIdChange = (value) => {
    setFormData((prev) => ({ ...prev, patientId: value }))
    setLookupError("")
    if (lookupTimer.current) clearTimeout(lookupTimer.current)
    if (!value || value.length < 3) return
    lookupTimer.current = setTimeout(async () => {
      setLookupLoading(true)
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/patient/lookup/${encodeURIComponent(value)}`)
        const p = res.data
        setFormData((prev) => ({
          ...prev,
          patientName: p.patient_name || prev.patientName,
          insuranceProvider: p.insurance_provider || prev.insuranceProvider,
          insuranceId: p.insurance_id || prev.insuranceId,
        }))
        setLookupError("")
      } catch {
        setLookupError("Patient not found")
      }
      setLookupLoading(false)
    }, 500)
  }

  const canProceed = () => {
    if (step === 0) return formData.patientName && formData.patientId && formData.diagnosis && formData.insuranceProvider && formData.insuranceId
    if (step === 1) return true
    if (step === 2) return files.length >= 3 || showSimilarityCheck
    return true
  }

  const handleNext = () => {
    if (!canProceed()) { toast.warning("Please fill all required fields"); return }
    if (step === 0) { setStep(1); return }
    if (step === 1) { setStep(2); return }
    if (step === 2) {
      if (!showSimilarityCheck) { setShowSimilarityCheck(true); return }
      if (files.length < 3) { toast.warning("Minimum 3 documents required"); return }
      setStep(3); return
    }
  }

  const handleSimilarityConfirm = () => { setSimilarityConfirmed(true); setShowSimilarityCheck(false); setStep(3) }
  const handleSimilarityCancel = () => setShowSimilarityCheck(false)

  const processingStages = [
    "Uploading clinical documents",
    "Running OCR text extraction",
    "Analyzing clinical information",
    "Matching insurance policy",
    "Generating authorization decision",
  ]
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    if (!loading) return
    setStageIndex(0)
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        if (prev < processingStages.length - 1) return prev + 1
        return prev
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [loading])

  const handleSubmit = async () => {
    if (files.length < 3) { toast.warning("Minimum 3 healthcare documents required"); return }
    if (!formData.patientName || !formData.patientId || !formData.diagnosis || !formData.insuranceProvider || !formData.insuranceId) {
      toast.warning("Please complete all required fields"); return
    }
    setLoading(true); setResult(null); setCurrentStage("Uploading clinical documents")
    const data = new FormData()
    Object.keys(formData).forEach((key) => data.append(key, formData[key]))
    files.forEach((file) => data.append("files", file))
    try {
      const token = localStorage.getItem("access_token")
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/submit-request`, data, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      })
      setResult(response.data)
      setLoading(false)
    } catch (error) {
      toast.error(friendlyMessage(error))
      setLoading(false)
    }
  }

  const inputClass = "input-field"

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button onClick={() => navigate("/doctor-dashboard")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <span className="inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 px-4 py-2 rounded-full">
          <Stethoscope size={14} className="text-teal-600" />
          <span className="text-xs font-semibold text-teal-800 dark:text-teal-400">New Prior Authorization</span>
        </span>
      </div>

      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = i === step
            const isDone = i < step
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1 min-w-[140px]">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    isDone ? "bg-success-600 text-white" : isActive ? "bg-brand-700 text-white shadow-md shadow-brand-700/30" : "bg-slate-100 dark:bg-navy-800 text-slate-400"
                  }`}>
                    {isDone ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                  </div>
                  <span className={`text-xs font-semibold hidden md:block ${isActive ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${isDone ? "bg-success-500" : "bg-slate-200 dark:bg-navy-700"}`} />}
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="min-h-[400px] flex flex-col">
        {step === 0 && (
          <div className="flex-1 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Patient Information</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Enter the patient and insurance details for this authorization.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Patient Name *</label>
                <input type="text" placeholder="Full name" value={formData.patientName} onChange={(e) => setFormData({ ...formData, patientName: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Patient ID / Insurance ID *</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Enter insurance ID or email" value={formData.patientId} onChange={(e) => handlePatientIdChange(e.target.value)} className={`${inputClass} pl-10`} />
                  {lookupLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500 animate-spin" />}
                </div>
                {lookupError && <p className="text-xs text-danger-600 mt-1">{lookupError}</p>}
                {formData.patientName && !lookupLoading && (
                  <p className="text-xs text-success-600 mt-1 font-medium">Patient: {formData.patientName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Diagnosis *</label>
                <input type="text" placeholder="Primary diagnosis" value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Procedure Code</label>
                <input type="text" placeholder="CPT code" value={formData.procedureCode} onChange={(e) => setFormData({ ...formData, procedureCode: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Doctor Name</label>
                <input type="text" placeholder="Attending physician" value={formData.doctorName} onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Insurance Provider *</label>
                <select value={formData.insuranceProvider} onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })} className={inputClass}>
                  <option value="">Select provider</option>
                  {providers.map((p) => <option key={p.id || p.provider_name} value={p.provider_name}>{p.provider_name}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Insurance ID *</label>
                <input type="text" placeholder="Insurance ID / Member ID" value={formData.insuranceId} onChange={(e) => setFormData({ ...formData, insuranceId: e.target.value })} className={inputClass} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Case Urgency</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Select the clinical urgency level to prioritize processing.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Urgency Level</label>
              <div className="grid grid-cols-4 gap-3">
                {["critical", "high", "medium", "low"].map((level) => (
                  <button key={level} onClick={() => setUrgencyLevel(level)}
                    className={`py-2.5 rounded-lg font-semibold capitalize text-sm border transition-all ${
                      urgencyLevel === level
                        ? URGENCY_STYLES[level].active
                        : "bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800"
                    }`}>
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <UrgencyIndicator urgencyLevel={urgencyLevel} />
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 space-y-4">
            {!showSimilarityCheck ? (
              <>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload Clinical Documents</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Upload at least <strong>3 healthcare documents</strong> (PDF, images) for AI analysis.</p>
                </div>
                <FileUpload setFiles={setFiles} />
                {files.length > 0 && (
                  <div className="bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-800 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-success-600" />
                    <span className="text-sm text-success-700 dark:text-success-500 font-medium">{files.length} file{files.length !== 1 ? "s" : ""} ready for submission</span>
                  </div>
                )}
              </>
            ) : (
              <DocumentSimilarityCheck files={files} onConfirm={handleSimilarityConfirm} onCancel={handleSimilarityCancel} />
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Review & Submit</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Confirm the details below before submitting for AI authorization.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: "Patient", value: formData.patientName },
                { label: "Patient ID", value: formData.patientId },
                { label: "Diagnosis", value: formData.diagnosis },
                { label: "Procedure Code", value: formData.procedureCode || "—" },
                { label: "Doctor", value: formData.doctorName || "—" },
                { label: "Insurance", value: formData.insuranceProvider },
                { label: "Insurance ID", value: formData.insuranceId },
                { label: "Urgency", value: urgencyLevel },
                { label: "Documents", value: `${files.length} file${files.length !== 1 ? "s" : ""}` },
              ].map((f) => (
                <div key={f.label} className="bg-slate-50 dark:bg-navy-800/50 rounded-lg px-4 py-3 border border-slate-100 dark:border-navy-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize">{f.label}</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 capitalize">{f.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4 flex items-start gap-3">
              <BadgeCheck size={20} className="text-teal-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-teal-900 dark:text-teal-400">
                By submitting, you authorize the AI engine to process this request using the provided clinical documents and patient data.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-navy-800">
          <Button variant="secondary" onClick={() => step > 0 ? setStep(step - 1) : navigate("/doctor-dashboard")}>
            <ArrowLeft size={16} /> {step === 0 ? "Cancel" : "Back"}
          </Button>

          {step === 2 && showSimilarityCheck ? (
            <span />
          ) : step < 3 ? (
            <Button onClick={handleNext}>
              {step === 2 ? "Run Similarity Check" : "Next"} <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} loading={loading}>
              {loading ? "Submitting..." : "Submit Authorization"} {!loading && <ArrowRight size={16} />}
            </Button>
          )}
        </div>
      </Card>

      {loading && (
        <div className="animate-slide-up">
          <Card className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                <Brain className="text-brand-600 animate-pulse" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Processing Authorization Request</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Secure AI pipeline is analyzing your documents...</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {processingStages.map((stage, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${
                  i < stageIndex ? "bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-800" :
                  i === stageIndex ? "bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800" : "bg-slate-50 dark:bg-navy-800/50 border-slate-200 dark:border-navy-700"
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    i < stageIndex ? "bg-success-500" : i === stageIndex ? "bg-brand-600 animate-pulse" : "bg-slate-300 dark:bg-navy-700"
                  }`}>
                    {i < stageIndex ? (
                      <CheckCircle2 className="text-white" size={14} />
                    ) : i === stageIndex ? (
                      <Loader2 className="text-white animate-spin" size={14} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    i < stageIndex ? "text-success-700 dark:text-success-500" : i === stageIndex ? "text-brand-700 dark:text-brand-400" : "text-slate-400"
                  }`}>{stage}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="w-full bg-slate-200 dark:bg-navy-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-600 to-teal-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((stageIndex + 1) / processingStages.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">This may take a few moments depending on document complexity</p>
            </div>
          </Card>
        </div>
      )}

      {result && (
        <div className="animate-slide-up">
          <StatusCard result={result} />
        </div>
      )}
    </div>
  )
}