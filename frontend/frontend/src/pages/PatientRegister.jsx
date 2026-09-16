import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { UserRound, Mail, Lock, ShieldCheck, HeartPulse, BadgeCheck, AlertCircle } from "lucide-react"
import AuthLayout from "../components/ui/AuthLayout"
import Button from "../components/ui/Button"
import { toast, friendlyMessage } from "../services/toast"

/**
 * Normalize backend error responses into a single display string.
 */
function backendErrorMessage(data, status) {
  if (!data) return "Something went wrong. Please try again."
  const detail = data.detail || data.message
  if (Array.isArray(detail)) {
    const msgs = detail.map((e) => e.msg).filter(Boolean)
    return msgs.length ? msgs[0] : "Please check your input and try again."
  }
  if (typeof detail === "string" && detail) return detail
  return `Server error (${status}). Please try again.`
}

export default function PatientRegister() {
  const navigate = useNavigate()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({ patient_name: "", email: "", password: "", insurance_provider: "" })

  useEffect(() => {
    async function loadProviders() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/providers`)
        const data = await response.json()
        setProviders(data.providers || [])
      } catch (error) { console.log(error); toast.error(friendlyMessage(error)) }
    }
    loadProviders()
  }, [])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleRegister = async () => {
    if (!formData.patient_name || !formData.email || !formData.password || !formData.insurance_provider) {
      setError("Please complete all required fields.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/patient/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok && data.status === "Success") {
        localStorage.setItem("access_token", data.access_token)
        localStorage.setItem("patient_name", data.patient_name)
        localStorage.setItem("patient_email", data.patient_email)
        localStorage.setItem("insurance_provider", data.insurance_provider)
        localStorage.setItem("insurance_id", data.insurance_id)
        localStorage.setItem("policy_number", data.policy_number)
        localStorage.setItem("coverage_status", data.coverage_status)
        setSuccess("Registration successful! Redirecting...")
        setTimeout(() => navigate("/patient-dashboard"), 1200)
      } else {
        const msg = backendErrorMessage(data, res.status)
        setError(msg)
        toast.error(msg)
      }
    } catch (err) {
      const msg = friendlyMessage(err)
      setError(msg)
      toast.error(msg)
    }
    setLoading(false)
  }

  return (
    <AuthLayout
      title="Patient Registration"
      subtitle="Register for AI-powered healthcare insurance and prior authorization services"
      icon={HeartPulse}
      accentText="text-rose-600 dark:text-rose-400"
      features={[
        { title: "AI Registration Engine", description: "Faster patient onboarding workflows" },
        { title: "Secure Healthcare Access", description: "Protected insurance registration" },
        { title: "Intelligent Verification", description: "Real-time AI insurance validation" },
      ]}
    >
      <div className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-800 rounded-lg p-3">
            <AlertCircle size={16} className="text-danger-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2.5 bg-success-50 dark:bg-success-500/10 border border-success-500/20 rounded-lg p-3 animate-pulse">
            <BadgeCheck size={16} className="text-success-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-success-700 dark:text-success-500">{success}</p>
          </div>
        )}

        <div>
          <label className="label" htmlFor="patient_name">Patient Name</label>
          <div className="relative">
            <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="patient_name" type="text" name="patient_name" placeholder="Enter patient name"
              value={formData.patient_name} onChange={handleChange} className="input-field pl-10" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="pat-email">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="pat-email" type="email" name="email" placeholder="Enter patient email"
              value={formData.email} onChange={handleChange} className="input-field pl-10" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="pat-password">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="pat-password" type="password" name="password" placeholder="Create password (min. 6 characters)"
              value={formData.password} onChange={handleChange} className="input-field pl-10" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="insurance_provider">Insurance Provider</label>
          <div className="relative">
            <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select name="insurance_provider" value={formData.insurance_provider} onChange={handleChange}
              className="input-field pl-10 appearance-none">
              <option value="">Select Insurance Provider</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.provider_name}>{provider.provider_name}</option>
              ))}
            </select>
          </div>
        </div>

        <Button variant="primary" size="lg" className="w-full" onClick={handleRegister} loading={loading}>
          {!loading && "Register Patient"}
        </Button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <button onClick={() => navigate("/patient-login")} className="font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300">
            Sign in
          </button>
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-5 border-t border-slate-100 dark:border-navy-800">
        <ShieldCheck size={12} />
        Your healthcare registration data is securely protected.
      </div>
    </AuthLayout>
  )
}