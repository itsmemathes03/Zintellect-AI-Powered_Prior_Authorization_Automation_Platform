import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, AlertCircle, ShieldCheck, HeartPulse } from "lucide-react"
import AuthLayout from "../components/ui/AuthLayout"
import Button from "../components/ui/Button"

export default function PatientLogin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError("Please enter email and password"); return
    }
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/patient/login`, {
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
        localStorage.setItem("policy_number", data.policy_number)
        localStorage.setItem("coverage_status", data.coverage_status)
        localStorage.setItem("insurance_id", data.insurance_id)
        navigate("/patient-dashboard")
      } else {
        setError(data.detail || data.message || "Login failed")
      }
    } catch {
      setError("Login failed. Check your credentials.")
    }
    setLoading(false)
  }

  return (
    <AuthLayout
      title="Patient Login"
      subtitle="Sign in to track your authorization requests"
      icon={HeartPulse}
      accentText="text-rose-600 dark:text-rose-400"
      features={[
        { title: "Request Status", description: "Track your prior authorization in real-time" },
        { title: "Insurance Dashboard", description: "View coverage and policy details" },
        { title: "Secure Access", description: "Your health data is protected at all times" },
      ]}
    >
      <div className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-800 rounded-lg p-3">
            <AlertCircle size={16} className="text-danger-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p>
          </div>
        )}

        <div>
          <label className="label" htmlFor="patient-email">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="patient-email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="patient-password">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="patient-password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="input-field pl-10"
            />
          </div>
        </div>

        <Button variant="primary" size="lg" className="w-full" onClick={handleLogin} loading={loading}>
          {!loading && "Patient Login"}
        </Button>

        <button onClick={() => navigate("/patient-register")}
          className="w-full border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-navy-800/70 rounded-lg py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors">
          New Patient? Register Here
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-5 border-t border-slate-100 dark:border-navy-800">
        <ShieldCheck size={12} />
        Your healthcare data is securely protected.
      </div>
    </AuthLayout>
  )
}