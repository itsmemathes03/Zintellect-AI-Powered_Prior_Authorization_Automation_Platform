import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { ShieldCheck, Mail, Lock, Building2, AlertCircle, Sparkles, CheckCircle2, Activity } from "lucide-react"
import AuthLayout from "../components/ui/AuthLayout"
import Button from "../components/ui/Button"

export default function ProviderRegister() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({ provider_name: "", email: "", password: "" })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  const handleRegister = async () => {
    if (!formData.provider_name || !formData.email || !formData.password) {
      setError("Please fill all fields"); return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email"); return
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters"); return
    }
    setLoading(true)
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/provider/register`, formData)
      if (response.data.status === "Success") {
        setFormData({ provider_name: "", email: "", password: "" })
        navigate("/provider-login")
      } else {
        setError(response.data.detail || response.data.message || "Registration failed")
      }
    } catch (error) {
      setError(error.response?.data?.detail || error.response?.data?.message || "Provider registration failed")
    }
    setLoading(false)
  }

  return (
    <AuthLayout
      title="Provider Registration"
      subtitle="Create your provider account and streamline prior authorization workflows"
      icon={Building2}
      accentText="text-emerald-700 dark:text-emerald-400"
      features={[
        { title: "AI-Powered Automation", description: "Reduce authorization review time" },
        { title: "Enterprise Security", description: "HIPAA-aware healthcare protection" },
        { title: "Real-time Analytics", description: "Monitor workflows and policies instantly" },
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
          <label className="label" htmlFor="provider_name">Insurance Provider Name</label>
          <div className="relative">
            <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="provider_name" type="text" name="provider_name" placeholder="Enter insurance provider name"
              value={formData.provider_name} onChange={handleChange} className="input-field pl-10" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="prov-email">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="prov-email" type="email" name="email" placeholder="Enter provider email"
              value={formData.email} onChange={handleChange} className="input-field pl-10" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="prov-password">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="prov-password" type="password" name="password" placeholder="Create secure password"
              value={formData.password} onChange={handleChange} className="input-field pl-10" />
          </div>
        </div>

        <Button variant="primary" size="lg" className="w-full" onClick={handleRegister} loading={loading}>
          {!loading && "Register Provider"}
        </Button>

        <button onClick={() => navigate("/provider-login")}
          className="w-full border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-navy-800/70 rounded-lg py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors">
          Already Have Account? Login
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-5 border-t border-slate-100 dark:border-navy-800">
        <ShieldCheck size={12} />
        Your provider data is protected with enterprise-grade healthcare security.
      </div>
    </AuthLayout>
  )
}