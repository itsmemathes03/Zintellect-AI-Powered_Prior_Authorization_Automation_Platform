import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Stethoscope, Mail, Key, AlertCircle, Lock } from "lucide-react"
import { doctorLogin } from "../services/api"
import AuthLayout from "../components/ui/AuthLayout"
import Button from "../components/ui/Button"

export default function DoctorLogin() {
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
      setError("Please fill all fields")
      return
    }
    setLoading(true)
    try {
      const res = await doctorLogin(formData)
      if (res.data.status === "Success") {
        localStorage.setItem("access_token", res.data.access_token)
        localStorage.setItem("doctor_name", res.data.doctor_name || "Doctor")
        localStorage.setItem("doctor_id", res.data.doctor_id || "")
        navigate("/doctor-dashboard")
      } else {
        setError(res.data.message || "Login failed")
      }
    } catch {
      setError("Authentication failed. Check your credentials.")
    }
    setLoading(false)
  }

  return (
    <AuthLayout
      title="Doctor Login"
      subtitle="Sign in to manage patient authorization requests"
      icon={Stethoscope}
      accentText="text-teal-700 dark:text-teal-400"
      features={[
        { title: "Request Management", description: "Submit and track prior authorization requests" },
        { title: "Patient Records", description: "Access patient insurance and clinical history" },
        { title: "AI Assistance", description: "Leverage AI-powered document and policy analysis" },
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
          <label className="label" htmlFor="doctor-email">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="doctor-email"
              type="email"
              name="email"
              placeholder="doctor@zintellect.ai"
              value={formData.email}
              onChange={handleChange}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="doctor-password">Password</label>
          <div className="relative">
            <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="doctor-password"
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
          {!loading && "Doctor Login"}
        </Button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{" "}
          <button onClick={() => navigate("/doctor-register")} className="font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">
            Register here
          </button>
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-5 border-t border-slate-100 dark:border-navy-800">
        <Lock size={12} />
        Secure portal for healthcare professionals. All access is logged.
      </div>
    </AuthLayout>
  )
}