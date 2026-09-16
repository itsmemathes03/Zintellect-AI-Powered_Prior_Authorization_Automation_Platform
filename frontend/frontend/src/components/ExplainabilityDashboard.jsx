import {
  Brain,
  Shield,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react"

export default function ExplainabilityDashboard({ result }) {
  if (!result) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-8 text-center">
        <Brain className="text-blue-800 mx-auto mb-4" size={40} />
        <p className="text-blue-900 font-semibold">
          No AI analysis available yet. Submit a request to see explainability
          details.
        </p>
      </div>
    )
  }

  const confidence = Number(result.confidence_score) || 0

  const reasoningSteps = result.xai_reasoning
    ? result.xai_reasoning.split("\n").filter((line) => line.trim())
    : []

  const clauses = result.matched_policy_clause
    ? result.matched_policy_clause.split("\n").filter((line) => line.trim())
    : []

  const missingDocs = result.missing_documents
    ? result.missing_documents.split("\n").filter((line) => line.trim())
    : []

  const statusColors = {
    approved:
      "bg-emerald-100 text-emerald-800 border border-emerald-200",
    denied:
      "bg-red-100 text-red-800 border border-red-200",
    pending:
      "bg-amber-100 text-amber-800 border border-amber-200",
    "under review":
      "bg-blue-100 text-blue-800 border border-blue-200",
    "awaiting review":
      "bg-amber-100 text-amber-800 border border-amber-200",
  }

  const urgencyColors = {
    urgent: "text-red-700",
    high: "text-amber-700",
    normal: "text-slate-700",
    low: "text-slate-500",
  }

  const statusLower = (result.status || "").toLowerCase()
  const statusClass =
    statusColors[statusLower] ||
    "bg-slate-100 text-slate-800 border border-slate-200"

  const urgencyLower = (result.urgency_level || "").toLowerCase()
  const urgencyClass = urgencyColors[urgencyLower] || "text-slate-700"

  return (
    <div className="space-y-8">
      {/* CONFIDENCE SCORE */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
            <TrendingUp className="text-blue-800" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-blue-950">
              AI Confidence Score
            </h2>
            <p className="text-slate-600 mt-2">
              Likelihood this authorization is appropriate
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SCORE RING */}
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 120 120"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeDasharray={`${(confidence / 100) * 314} 314`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#1e40af" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-blue-950">
                    {confidence}
                    <span className="text-xl">%</span>
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Confidence</p>
                </div>
              </div>
            </div>
          </div>

          {/* REQUEST METADATA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-slate-500" size={18} />
                <span className="font-semibold text-slate-900">Status</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusClass}`}>
                {result.status || "Unknown"}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <FileText className="text-slate-500" size={18} />
                <span className="font-semibold text-slate-900">
                  Procedure Code
                </span>
              </div>
              <span className="text-sm font-bold text-slate-700">
                {result.procedure_code || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <Brain className="text-slate-500" size={18} />
                <span className="font-semibold text-slate-900">Diagnosis</span>
              </div>
              <span className="text-sm font-bold text-slate-700 text-right max-w-[60%]">
                {result.diagnosis || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <Clock className="text-slate-500" size={18} />
                <span className="font-semibold text-slate-900">
                  Urgency Level
                </span>
              </div>
              <span className={`text-sm font-bold ${urgencyClass}`}>
                {result.urgency_level || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* REASONING TRACE */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
            <Brain className="text-purple-800" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-blue-950">
              AI Reasoning Trace
            </h2>
            <p className="text-slate-600 mt-2">
              Step-by-step explainable AI decision path
            </p>
          </div>
        </div>

        {reasoningSteps.length > 0 ? (
          <div className="space-y-4">
            {reasoningSteps.map((step, idx) => {
              const isLast = idx === reasoningSteps.length - 1
              const isWarning =
                step.toLowerCase().includes("missing") ||
                step.toLowerCase().includes("alert") ||
                step.toLowerCase().includes("warning")
              return (
                <div
                  key={idx}
                  className={`flex gap-4 pb-4 ${
                    isLast ? "" : "border-b border-slate-200"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isWarning ? "bg-amber-100" : "bg-emerald-100"
                    }`}
                  >
                    {isWarning ? (
                      <AlertCircle className="text-amber-700" size={20} />
                    ) : (
                      <CheckCircle2 className="text-emerald-700" size={20} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{step}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-slate-500 italic">No reasoning data available.</p>
        )}
      </div>

      {/* POLICY CLAUSES */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <Shield className="text-emerald-800" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-blue-950">
              Matched Policy Clauses
            </h2>
            <p className="text-slate-600 mt-2">
              Insurance policies that supported this decision
            </p>
          </div>
        </div>

        {clauses.length > 0 ? (
          <div className="space-y-4">
            {clauses.map((clause, idx) => (
              <div
                key={idx}
                className="border border-emerald-200 bg-emerald-50 rounded-2xl p-5"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="text-emerald-600 mt-0.5 flex-shrink-0"
                    size={20}
                  />
                  <p className="font-semibold text-emerald-950">{clause}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 italic">
            No matched policy clauses available.
          </p>
        )}
      </div>

      {/* MISSING DOCUMENTS */}
      {missingDocs.length > 0 && (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="text-amber-800" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-blue-950">
                Missing Documents
              </h2>
              <p className="text-slate-600 mt-2">
                Additional documentation required for approval
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {missingDocs.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl"
              >
                <AlertTriangle
                  className="text-amber-600 mt-0.5 flex-shrink-0"
                  size={18}
                />
                <p className="font-medium text-amber-900">{doc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
