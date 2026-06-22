import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import {
  Brain, ShieldCheck, CheckCircle2, UploadCloud, BadgeCheck,
  ArrowLeft, ArrowRight, FileText, UserRound, Stethoscope,
  Building2, Microscope, IdCard, AlertTriangle, Search, Loader2
} from "lucide-react"
import RequestForm from "../components/RequestForm"
import FileUpload from "../components/FileUpload"
import StatusCard from "../components/StatusCard"
import ProcessingTracker from "../components/ProcessingTracker"
import UrgencyIndicator from "../components/UrgencyIndicator"
import DocumentSimilarityCheck from "../components/DocumentSimilarityCheck"
import PageTransition from "../components/PageTransition"

const STEPS = [
  { id: "patient", label: "Patient Info", icon: UserRound },
  { id: "urgency", label: "Urgency & Match", icon: AlertTriangle },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "submit", label: "Review & Submit", icon: UploadCloud },
]

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
    } catch (error) { console.log(error) }
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
    if (!canProceed()) { alert("Please fill all required fields"); return }
    if (step === 0) { setStep(1); return }
    if (step === 1) { setStep(2); return }
    if (step === 2) {
      if (!showSimilarityCheck) { setShowSimilarityCheck(true); return }
      if (files.length < 3) { alert("Minimum 3 documents required"); return }
      setStep(3); return
    }
  }

  const handleSimilarityConfirm = () => { setSimilarityConfirmed(true); setShowSimilarityCheck(false); setStep(3) }
  const handleSimilarityCancel = () => setShowSimilarityCheck(false)

  const handleSubmit = async () => {
    if (files.length < 3) { alert("Minimum 3 healthcare documents required"); return }
    if (!formData.patientName || !formData.patientId || !formData.diagnosis || !formData.insuranceProvider || !formData.insuranceId) {
      alert("Please complete all required fields"); return
    }
    setLoading(true); setResult(null)
    const data = new FormData()
    Object.keys(formData).forEach((key) => data.append(key, formData[key]))
    files.forEach((file) => data.append("files", file))
    try {
      setCurrentStage("Insurance Verification")
      const token = localStorage.getItem("access_token")
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/submit-request`, data, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      })
      setResult(response.data)
      const workflowStages = [
        "Insurance Verification", "Medical File Upload", "Clinical Text Extraction",
        "Healthcare AI Analysis", "Policy Rule Matching", "Final Authorization Decision"
      ]
      let stageIndex = 0
      const interval = setInterval(() => {
        setCurrentStage(workflowStages[stageIndex])
        stageIndex++
        if (stageIndex === workflowStages.length) { clearInterval(interval); setLoading(false) }
      }, 1200)
    } catch (error) {
      console.log(error)
      setLoading(false)
      const raw = error.response?.data?.message || error.response?.data?.detail || error.message
      const msg = typeof raw === "string" ? raw : typeof raw === "object" ? JSON.stringify(raw) : "Authorization request failed"
      alert(msg)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-sky-50/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-300/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-300/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6">

          {/* BACK BUTTON + HEADER */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate("/doctor-dashboard")}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all font-semibold text-slate-700 text-sm">
              <ArrowLeft size={18} /> Back
            </button>
            <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-100 px-4 py-2 rounded-full">
              <Stethoscope size={14} className="text-cyan-600" />
              <span className="text-xs font-semibold text-cyan-800">New Prior Authorization</span>
            </div>
          </div>

          {/* STEP PROGRESS */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => {
                const Icon = s.icon
                const isActive = i === step
                const isDone = i < step
                return (
                  <div key={s.id} className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isDone ? "bg-emerald-500 text-white" : isActive ? "bg-gradient-to-r from-cyan-700 to-sky-600 text-white shadow-md" : "bg-slate-100 text-slate-400"
                      }`}>
                        {isDone ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                      </div>
                      <span className={`text-xs font-semibold hidden sm:block ${isActive ? "text-slate-900" : "text-slate-400"}`}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 rounded ${isDone ? "bg-emerald-400" : "bg-slate-200"}`} />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* STEP CONTENT */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg p-6 min-h-[400px] flex flex-col">

            {/* STEP 0: PATIENT INFO */}
            {step === 0 && (
              <div className="flex-1 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Patient Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Patient Name *</label>
                    <input type="text" placeholder="Full name" value={formData.patientName} onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Patient ID / Insurance ID *</label>
                    <div className="relative">
                      <input type="text" placeholder="Enter insurance ID or email" value={formData.patientId} onChange={(e) => handlePatientIdChange(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm text-slate-900" />
                      <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
                      {lookupLoading && <Loader2 size={16} className="absolute right-3 top-3.5 text-cyan-500 animate-spin" />}
                    </div>
                    {lookupError && <p className="text-xs text-red-500 mt-1">{lookupError}</p>}
                    {formData.patientName && !lookupLoading && (
                      <p className="text-xs text-emerald-600 mt-1 font-medium">Patient: {formData.patientName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Diagnosis *</label>
                    <input type="text" placeholder="Primary diagnosis" value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Procedure Code</label>
                    <input type="text" placeholder="CPT code" value={formData.procedureCode} onChange={(e) => setFormData({ ...formData, procedureCode: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Doctor Name</label>
                    <input type="text" placeholder="Attending physician" value={formData.doctorName} onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Insurance Provider *</label>
                    <select value={formData.insuranceProvider} onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm text-slate-900">
                      <option value="">Select provider</option>
                      {providers.map((p) => <option key={p.id || p.provider_name} value={p.provider_name}>{p.provider_name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Insurance ID *</label>
                    <input type="text" placeholder="Insurance ID / Member ID" value={formData.insuranceId} onChange={(e) => setFormData({ ...formData, insuranceId: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm text-slate-900" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: URGENCY */}
            {step === 1 && (
              <div className="flex-1 space-y-6">
                <h2 className="text-lg font-bold text-slate-900">Case Urgency</h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Urgency Level</label>
                  <div className="grid grid-cols-4 gap-3">
                    {["critical", "high", "medium", "low"].map((level) => (
                      <button key={level} onClick={() => setUrgencyLevel(level)}
                        className={`py-2.5 rounded-xl font-semibold capitalize text-sm transition-all ${
                          urgencyLevel === level
                            ? level === "critical" ? "bg-red-600 text-white shadow-md" : level === "high" ? "bg-orange-600 text-white shadow-md" : level === "medium" ? "bg-yellow-600 text-white shadow-md" : "bg-green-600 text-white shadow-md"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <UrgencyIndicator urgencyLevel={urgencyLevel} />
              </div>
            )}

            {/* STEP 2: DOCUMENTS + SIMILARITY CHECK */}
            {step === 2 && (
              <div className="flex-1 space-y-4">
                {!showSimilarityCheck ? (
                  <>
                    <h2 className="text-lg font-bold text-slate-900">Upload Clinical Documents</h2>
                    <p className="text-xs text-slate-500">Upload at least <strong>3 healthcare documents</strong> (PDF, images) for AI analysis.</p>
                    <FileUpload setFiles={setFiles} />
                    {files.length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span className="text-sm text-emerald-700 font-medium">{files.length} file{files.length !== 1 ? "s" : ""} uploaded</span>
                      </div>
                    )}
                  </>
                ) : (
                  <DocumentSimilarityCheck files={files} onConfirm={handleSimilarityConfirm} onCancel={handleSimilarityCancel} />
                )}
              </div>
            )}

            {/* STEP 3: REVIEW & SUBMIT */}
            {step === 3 && (
              <div className="flex-1 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Review & Submit</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <div key={f.label} className="bg-slate-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-slate-500 font-medium">{f.label}</p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">{f.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 flex items-start gap-3">
                  <BadgeCheck size={20} className="text-cyan-600 mt-0.5" />
                  <p className="text-sm text-cyan-800">By submitting, you authorize the AI engine to process this request using the provided clinical documents and patient data.</p>
                </div>
              </div>
            )}

            {/* NAVIGATION BUTTONS */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => step > 0 ? setStep(step - 1) : navigate("/doctor-dashboard")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all">
                <ArrowLeft size={16} /> {step === 0 ? "Cancel" : "Back"}
              </button>

              {step === 2 && showSimilarityCheck ? (
                <div />
              ) : step < 3 ? (
                <button onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-700 to-sky-600 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all">
                  {step === 2 ? "Run Similarity Check" : "Next"} <ArrowRight size={16} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all ${
                    loading ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-cyan-700 to-sky-600 text-white hover:shadow-lg hover:scale-105"
                  }`}>
                  {loading ? "Submitting..." : "Submit Authorization"} {!loading && <ArrowRight size={16} />}
                </button>
              )}
            </div>
          </div>

          {/* PROCESSING / RESULTS */}
          {loading && (
            <div className="mt-6 animate-fadeIn">
              <ProcessingTracker currentStage={currentStage} />
            </div>
          )}
          {result && (
            <div className="mt-6 animate-fadeIn">
              <StatusCard result={result} />
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  )
}
