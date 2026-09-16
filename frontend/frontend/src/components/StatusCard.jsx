import { useState } from "react"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Brain,
  ShieldCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  Check,
  User,
  Stethoscope,
  Building2,
} from "lucide-react"
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts"
import { motion, AnimatePresence } from "framer-motion"

export default function StatusCard({ result }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(null)

  if (!result) return null

  const status = result.status || result.decision || "Pending"

  const isApproved = status === "Approved"
  const isRejected = status === "Rejected" || status === "Rejected"
  const isError = status === "Error"
  const isPending = status === "Pending" || status === "Processing"
  const isManualReview = status === "Manual Review"
  const isNoPolicy = status === "No Policy Available"

  const confidence = result.confidence_score || 0

  const config = isApproved
    ? { icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-500", label: "Approved", gaugeColor: "#10b981", ring: "ring-emerald-200" }
    : isRejected
    ? { icon: XCircle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200", badge: "bg-red-500", label: "Rejected", gaugeColor: "#ef4444", ring: "ring-red-200" }
    : isError
    ? { icon: XCircle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200", badge: "bg-red-500", label: "Error", gaugeColor: "#ef4444", ring: "ring-red-200" }
    : isManualReview
    ? { icon: AlertTriangle, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-500", label: "Manual Review", gaugeColor: "#f59e0b", ring: "ring-orange-200" }
    : isNoPolicy
    ? { icon: AlertTriangle, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-500", label: "No Policy Available", gaugeColor: "#f59e0b", ring: "ring-amber-200" }
    : { icon: AlertTriangle, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-400", label: "Pending Review", gaugeColor: "#f59e0b", ring: "ring-orange-200" }

  const StatusIcon = config.icon

  const message = result.message || ""

  const gaugeData = [{ value: confidence, fill: config.gaugeColor }]

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const detailSections = [
    {
      key: "entities",
      title: "Extracted Clinical Entities",
      icon: Brain,
      color: "text-purple-700",
      bg: "bg-purple-50",
      border: "border-purple-200",
      content: result.extracted_entities,
    },
    {
      key: "policy",
      title: "Insurance Policy Match",
      icon: ShieldCheck,
      color: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-200",
      content: result.policy_rules,
    },
    {
      key: "conditions",
      title: "Matched Conditions",
      icon: CheckCircle2,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      content: result.matched_conditions,
    },
    {
      key: "missing",
      title: "Missing Requirements",
      icon: AlertTriangle,
      color: "text-orange-700",
      bg: "bg-orange-50",
      border: "border-orange-200",
      content: result.missing_requirements,
    },
    {
      key: "xai",
      title: "AI Reasoning / Explanation",
      icon: Sparkles,
      color: "text-indigo-700",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      content: result.xai_reasoning || result.provider_explanation,
    },
    {
      key: "patient_explanation",
      title: "Patient Explanation",
      icon: User,
      color: "text-teal-700",
      bg: "bg-teal-50",
      border: "border-teal-200",
      content: result.patient_explanation,
    },
  ]

  const renderContent = (content, sectionKey) => {
    if (!content) return <p className="text-sm text-slate-400 italic">Not available</p>
    if (typeof content === "string") {
      return <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{content}</p>
    }
    if (Array.isArray(content)) {
      if (content.length === 0) return <p className="text-sm text-slate-400 italic">None</p>
      return (
        <ul className="space-y-1.5">
          {content.map((item, i) => (
            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-current mt-2 flex-shrink-0 opacity-60" />
              {typeof item === "string" ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      )
    }
    if (typeof content === "object") {
      return (
        <div className="space-y-2">
          {Object.entries(content).filter(([k]) => k !== "full_clinical_text").map(([key, value]) => {
            if (value === null || value === undefined || value === "") return null
            const displayValue = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)
            if (displayValue.length > 200) return null
            return (
              <div key={key} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[120px]">{key.replace(/_/g, " ")}</span>
                <span className="text-sm text-slate-700">{displayValue}</span>
              </div>
            )
          })}
        </div>
      )
    }
    return <p className="text-sm text-slate-700">{String(content)}</p>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${config.bg} border ${config.border} rounded-2xl overflow-hidden`}
    >
      {/* Main Status */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Confidence Gauge */}
          <div className="w-20 h-20 flex-shrink-0">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="100%"
              barSize={8}
              data={gaugeData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background={{ fill: "#e2e8f0" }} dataKey="value" cornerRadius={4} />
            </RadialBarChart>
            <div className="relative -mt-[52px] flex items-center justify-center h-[52px]">
              <span className="text-sm font-extrabold text-slate-900">{confidence}%</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`w-10 h-10 rounded-xl ${config.badge} flex items-center justify-center shrink-0`}>
                <StatusIcon className="text-white" size={20} />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${config.color}`}>{config.label}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Confidence Score</p>
              </div>
              {result.request_id && (
                <span className="text-xs text-slate-400 font-mono ml-auto">
                  {result.request_id.slice(0, 8)}...
                </span>
              )}
            </div>
            {message && (
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{message}</p>
            )}
            {result.processing_time_seconds && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                <Clock size={12} />
                <span>Processed in {result.processing_time_seconds}s</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {detailSections.some((s) => s.content) && (
        <div className="border-t border-current/10">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-6 py-3 flex items-center justify-between text-sm font-semibold text-slate-600 hover:bg-white/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Brain size={16} />
              View Detailed Results
            </span>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 space-y-4">
                  {detailSections.map((section) => {
                    if (!section.content) return null
                    const Icon = section.icon
                    return (
                      <div key={section.key} className={`${section.bg} border ${section.border} rounded-xl p-4`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon size={16} className={section.color} />
                            <h3 className={`text-xs font-semibold ${section.color} uppercase tracking-wide`}>{section.title}</h3>
                          </div>
                          <button
                            onClick={() => handleCopy(
                              typeof section.content === "string"
                                ? section.content
                                : JSON.stringify(section.content, null, 2),
                              section.key
                            )}
                            className="p-1 rounded hover:bg-white/50 transition-colors"
                            title="Copy to clipboard"
                          >
                            {copied === section.key ? (
                              <Check size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={14} className="text-slate-400" />
                            )}
                          </button>
                        </div>
                        {renderContent(section.content, section.key)}
                      </div>
                    )
                  })}

                  {/* Documents info */}
                  {result.uploaded_files && (
                    <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} className="text-cyan-700" />
                        <h3 className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">Uploaded Documents</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(result.uploaded_files) ? result.uploaded_files : [result.uploaded_files]).map((file, i) => (
                          <span key={i} className="bg-white border border-cyan-200 rounded-lg px-3 py-1.5 text-xs font-medium text-cyan-800">
                            {typeof file === "string" ? file : file.name || JSON.stringify(file)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.uploaded_document_types && result.uploaded_document_types.length > 0 && (
                    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Stethoscope size={16} className="text-violet-700" />
                        <h3 className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Document Types Detected</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.uploaded_document_types.map((docType, i) => (
                          <span key={i} className="bg-white border border-violet-200 rounded-lg px-3 py-1.5 text-xs font-medium text-violet-800">
                            {docType}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
