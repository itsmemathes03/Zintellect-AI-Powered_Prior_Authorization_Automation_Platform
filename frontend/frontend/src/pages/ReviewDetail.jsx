import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft, User, Stethoscope, Activity, FileText, Brain,
  ShieldCheck, Calendar, CheckCircle2, XCircle, AlertTriangle, Sparkles, ClipboardList
} from "lucide-react"
import { getReviewRequest, submitReviewDecision } from "../services/api"
import { toast } from "../services/toast"
import PageHeader from "../components/ui/PageHeader"
import Card, { CardHeader, CardTitle } from "../components/ui/Card"
import StatusBadge from "../components/ui/StatusBadge"
import Badge from "../components/ui/Badge"
import EmptyState from "../components/ui/EmptyState"
import Button from "../components/ui/Button"
import ConfirmationDialog from "../components/ui/ConfirmationDialog"

const DECISION_VARIANTS = {
  Approved: { confirmLabel: "Approve", title: "Approve Request", message: "Approve this prior authorization request?", variant: "primary" },
  Rejected: { confirmLabel: "Reject", title: "Reject Request", message: "Reject this prior authorization request? This will notify the requesting physician.", variant: "danger" },
  "Request Info": { confirmLabel: "Request Info", title: "Request Additional Information", message: "Request additional information from the requesting physician?", variant: "warning" },
}

export default function ReviewDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const requestId = id

  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [decision, setDecision] = useState("")
  const [notes, setNotes] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  useEffect(() => {
    fetchRequest()
  }, [requestId])

  async function fetchRequest() {
    setLoading(true)
    try {
      const res = await getReviewRequest(requestId)
      setRequest(res)
    } catch (e) {
      toast.error("Failed to load request details")
    }
    setLoading(false)
  }

  const triggerDecision = (decisionValue) => {
    setDecision(decisionValue)
    setConfirmOpen(true)
  }

  const handleDecision = async () => {
    setActionLoading(true)
    try {
      const res = await submitReviewDecision(requestId, {
        decision,
        notes: notes || "",
      })
      if (res.status === "Success") {
        setSubmitted({ decision, reviewId: res.review_id })
        setConfirmOpen(false)
        toast.success(`Request ${decision}`)
        setTimeout(() => navigate("/provider-dashboard/review-queue"), 1500)
      } else {
        toast.error(res.message || "Action failed")
      }
    } catch (e) {
      toast.error("Action failed")
    }
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-label="Loading review details">
        <div className="h-16 bg-slate-100 dark:bg-navy-800 rounded-xl" />
        <div className="h-32 bg-slate-100 dark:bg-navy-800 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-64 bg-slate-100 dark:bg-navy-800 rounded-xl" />
          <div className="h-64 lg:col-span-2 bg-slate-100 dark:bg-navy-800 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Request Not Found"
        description="This request may no longer be awaiting review."
        action={<Button onClick={() => navigate("/provider-dashboard/review-queue")}>Back to Review Queue</Button>}
      />
    )
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto">
        <Card className="text-center py-12">
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
            submitted.decision === "Approved" ? "bg-success-50 dark:bg-success-500/10" :
            submitted.decision === "Rejected" ? "bg-danger-50 dark:bg-danger-500/10" :
            "bg-warning-50 dark:bg-warning-500/10"
          }`}>
            <CheckCircle2 size={32} className={
              submitted.decision === "Approved" ? "text-success-600" :
              submitted.decision === "Rejected" ? "text-danger-600" :
              "text-warning-600"
            } />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Request {submitted.decision}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Review ID: {submitted.reviewId}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            You will be redirected to the review queue.
          </p>
        </Card>
      </div>
    )
  }

  const recVariant = request.ai_recommendation === "Approved"
    ? { banner: "bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-800", accent: "text-success-600" }
    : request.ai_recommendation === "Rejected"
    ? { banner: "bg-danger-50 dark:bg-danger-500/10 border-danger-200 dark:border-danger-800", accent: "text-danger-600" }
    : { banner: "bg-warning-50 dark:bg-warning-500/10 border-warning-200 dark:border-warning-800", accent: "text-warning-600" }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Review Request"
        description="Review the AI assessment and make a final decision."
        icon={ClipboardList}
        actions={[
          <StatusBadge key="status" status={request.status} />,
          <Button key="back" variant="secondary" onClick={() => navigate("/provider-dashboard/review-queue")}>
            <ArrowLeft size={16} /> Back to Queue
          </Button>,
        ]}
      />

      <div className={`rounded-xl border p-6 ${recVariant.banner}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain size={18} className={recVariant.accent} />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">AI Recommendation</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={request.ai_recommendation} />
              {request.confidence_score != null && (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <Sparkles size={14} className="text-warning-500" />
                  Confidence: {(request.confidence_score * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md text-sm leading-6">
            Generated by the AI engine. Final approval decisions must be confirmed by a human provider below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient & Provider</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Patient</p>
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{request.patient_name}</p>
                  {request.patient_id && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ID: {request.patient_id}</p>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
                  <Stethoscope size={16} className="text-brand-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Attending Physician</p>
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{request.doctor_name || "—"}</p>
                  {request.insurance_provider && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{request.insurance_provider}</p>}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-navy-800 flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} className="text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Submitted</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {request.created_at ? new Date(request.created_at).toLocaleString() : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-navy-800 flex items-center justify-center flex-shrink-0">
                  <Activity size={16} className="text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Last Updated</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {request.updated_at ? new Date(request.updated_at).toLocaleString() : "—"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Information</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Procedure Code</p>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{request.procedure_code || "—"}</p>
              </div>
              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Urgency</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5 capitalize">{request.urgency_level || "Medium"}</p>
              </div>
              <div className="bg-slate-50 dark:bg-navy-800/50 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Request Status</p>
                <p className="mt-0.5"><StatusBadge status={request.status} /></p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Diagnosis</p>
              <p className="text-sm text-slate-900 dark:text-slate-200">{request.diagnosis || "—"}</p>
            </div>
            {request.clinical_notes && (
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Clinical Notes</p>
                <p className="text-sm text-slate-900 dark:text-slate-200 whitespace-pre-line">{request.clinical_notes}</p>
              </div>
            )}
          </Card>

          {request.xai_reasoning && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain size={16} className="text-purple-600" /> AI Reasoning
                </CardTitle>
              </CardHeader>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-6">{request.xai_reasoning}</p>
            </Card>
          )}

          {request.uploaded_files && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={16} className="text-teal-600" /> Uploaded Documents
                </CardTitle>
              </CardHeader>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{request.uploaded_files}</p>
            </Card>
          )}

          {request.matched_policy_clause && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-brand-600" /> Matched Policy Clause
                </CardTitle>
              </CardHeader>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{request.matched_policy_clause}</p>
            </Card>
          )}

          {request.missing_documents && (
            <div className="bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-warning-600" />
                <h3 className="text-xs font-semibold text-warning-800 dark:text-warning-500 uppercase tracking-wide">Missing Documents</h3>
              </div>
              <p className="text-sm text-warning-900 dark:text-warning-500 whitespace-pre-line">{request.missing_documents}</p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Reviewer Notes</CardTitle>
            </CardHeader>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add notes for the requesting physician (optional)..."
              className="input-field resize-none"
            />
          </Card>
        </div>
      </div>

      <div className="sticky bottom-4 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-elevated p-4 flex items-center justify-end gap-3 flex-wrap">
        <Button variant="danger" onClick={() => triggerDecision("Rejected")} disabled={actionLoading}>
          <XCircle size={16} /> Reject
        </Button>
        <Button variant="warning" onClick={() => triggerDecision("Request Info")} disabled={actionLoading}>
          <AlertTriangle size={16} /> Request Info
        </Button>
        <Button variant="success" onClick={() => triggerDecision("Approved")} disabled={actionLoading} loading={actionLoading}>
          <CheckCircle2 size={16} /> Approve
        </Button>
      </div>

      {decision && (
        <ConfirmationDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleDecision}
          loading={actionLoading}
          variant={DECISION_VARIANTS[decision].variant}
          title={DECISION_VARIANTS[decision].title}
          message={DECISION_VARIANTS[decision].message}
          confirmLabel={DECISION_VARIANTS[decision].confirmLabel}
        />
      )}
    </div>
  )
}