import { useState } from "react"
import { AlertTriangle, CheckCircle2, FileSearch, X, AlertCircle, Copy, Calendar } from "lucide-react"

export default function DocumentSimilarityCheck({ files, onConfirm, onCancel }) {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  const runCheck = async () => {
    if (!files || files.length === 0) return
    setChecking(true)
    try {
      const token = localStorage.getItem("access_token")
      const formData = new FormData()
      files.forEach((f) => formData.append("files", f))
      const res = await fetch(`${import.meta.env.VITE_API_URL}/similarity/check`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setResult({ has_duplicates: false, max_similarity: 0, total_matches: 0, matches: [], is_suspected_duplicate: false })
    }
    setChecking(false)
  }

  const handleProceed = () => {
    setConfirmed(true)
    if (onConfirm) onConfirm(result)
  }

  const getSeverityColor = (score) => {
    if (score >= 0.9) return "text-red-600"
    if (score >= 0.7) return "text-orange-600"
    if (score >= 0.5) return "text-yellow-600"
    return "text-emerald-600"
  }

  const getSeverityBg = (score) => {
    if (score >= 0.9) return "bg-red-50 border-red-200"
    if (score >= 0.7) return "bg-orange-50 border-orange-200"
    if (score >= 0.5) return "bg-yellow-50 border-yellow-200"
    return "bg-emerald-50 border-emerald-200"
  }

  const getSeverityIcon = (score) => {
    if (score >= 0.7) return <AlertTriangle className="text-red-500" size={24} />
    if (score >= 0.5) return <AlertCircle className="text-yellow-500" size={24} />
    return <CheckCircle2 className="text-emerald-500" size={24} />
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-inner">
          <FileSearch className="text-blue-700" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Document Similarity Check</h2>
          <p className="text-slate-500 text-sm">Detect duplicate or similar prior authorization submissions</p>
        </div>
      </div>

      {!result && !checking && (
        <div className="text-center py-8">
          <FileSearch className="mx-auto text-slate-300" size={56} />
          <h3 className="text-xl font-bold text-slate-900 mt-6">Check for Duplicates</h3>
          <p className="text-slate-500 mt-3 max-w-lg mx-auto">
            Scan your uploaded documents against existing submissions to detect potential duplicates or similar content.
          </p>
          <button
            onClick={runCheck}
            className="mt-6 bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl"
          >
            Run Similarity Check
          </button>
        </div>
      )}

      {checking && (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-700 font-bold text-lg">Analyzing documents...</p>
          <p className="text-slate-500 mt-2">Comparing against existing submissions</p>
        </div>
      )}

      {result && !checking && (
        <div className={`rounded-2xl border p-6 ${getSeverityBg(result.max_similarity)}`}>
          <div className="flex items-start gap-4">
            {getSeverityIcon(result.max_similarity)}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900">
                {result.is_suspected_duplicate
                  ? "Potential Duplicate Detected"
                  : result.total_matches > 0
                  ? "Similar Content Found"
                  : "No Duplicates Found"}
              </h3>
              <p className="text-slate-600 mt-2">
                {result.is_suspected_duplicate
                  ? "The uploaded documents are very similar to existing submissions. Please review before proceeding."
                  : result.total_matches > 0
                  ? `${result.total_matches} similar submission${result.total_matches > 1 ? "s" : ""} found with lower similarity scores.`
                  : "No matching or similar documents found in existing submissions."}
              </p>

              <div className="flex items-center gap-4 mt-4">
                <div className="bg-white/80 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-500">Max Similarity</p>
                  <p className={`text-2xl font-extrabold ${getSeverityColor(result.max_similarity)}`}>
                    {(result.max_similarity * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-white/80 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-500">Matches Found</p>
                  <p className="text-2xl font-extrabold text-slate-900">{result.total_matches}</p>
                </div>
              </div>
            </div>
          </div>

          {result.matches?.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-bold text-slate-900">Matched Submissions</h4>
              {result.matches.map((match, idx) => (
                <div key={idx} className="bg-white/80 rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{match.patient_name || "Unknown Patient"}</p>
                    <p className="text-sm text-slate-500">
                      {match.procedure_code && `${match.procedure_code} - `}{match.diagnosis?.substring(0, 50) || "N/A"}
                    </p>
                    {match.created_at && (
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(match.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`font-extrabold text-lg ${getSeverityColor(match.similarity)}`}>
                      {(match.similarity * 100).toFixed(0)}%
                    </span>
                    <p className="text-xs text-slate-400">
                      {match.match_type === "exact" ? "Exact Match" : "Text Similarity"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 mt-8">
            {result.is_suspected_duplicate ? (
              <>
                <button
                  onClick={handleProceed}
                  className="flex-1 bg-amber-600 text-white py-4 rounded-2xl font-bold hover:bg-amber-700 transition-all"
                >
                  Proceed Anyway
                </button>
                <button
                  onClick={onCancel}
                  className="flex-1 border border-slate-300 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <X size={20} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleProceed}
                className="w-full bg-gradient-to-r from-blue-700 to-indigo-600 text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl"
              >
                Continue with Submission
              </button>
            )}
          </div>
        </div>
      )}

      {confirmed && result && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="text-emerald-600" size={22} />
          <p className="text-emerald-700 font-medium">Similarity check completed and acknowledged</p>
        </div>
      )}
    </div>
  )
}
