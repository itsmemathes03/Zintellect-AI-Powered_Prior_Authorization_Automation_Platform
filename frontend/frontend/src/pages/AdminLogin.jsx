import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Key, AlertCircle, ArrowRight, ShieldCheck, Lock, Server } from "lucide-react"
import { adminLogin, adminForgotPassword } from "../services/api"
import AuthLayout from "../components/ui/AuthLayout"
import Button from "../components/ui/Button"

export default function AdminLogin() {
  const navigate = useNavigate()
  const [view, setView] = useState("login") // login | forgot
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [forgotEmail, setForgotEmail] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError("Please enter your email and password")
      return
    }
    setLoading(true)
    try {
      const res = await adminLogin(formData)
      if (res.data.status === "Success") {
        localStorage.setItem("admin_id", res.data.admin_id)
        localStorage.setItem("admin_name", res.data.admin_name)
        localStorage.setItem("access_token", res.data.access_token)
        navigate("/admin-dashboard")
      } else {
        setError(res.data.message || "Login failed")
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed")
    }
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      setError("Please enter your email")
      return
    }
    setLoading(true)
    try {
      const res = await adminForgotPassword({ email: forgotEmail })
      setMessage(res.data.message || "If the email exists, a reset link has been sent")
      setError("")
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to process request")
    }
    setLoading(false)
  }

  return (
    <AuthLayout
      title={view === "login" ? "Admin Login" : "Reset Password"}
      subtitle={view === "login" ? "Sign in to access the administrative console" : "Enter your email to receive a password reset link"}
      icon={Server}
      accentText="text-brand-700 dark:text-brand-400"
      features={[
        { title: "Platform Control", description: "Manage users, policies, and system-wide settings" },
        { title: "Real-time Monitoring", description: "Track authorization activity and system health" },
        { title: "Secure Access", description: "All administrative actions are logged and audited" },
      ]}
    >
      {view === "login" ? (
        <div className="space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-800 rounded-lg p-3">
              <AlertCircle size={16} className="text-danger-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p>
            </div>
          )}

          <div>
            <label className="label" htmlFor="email">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="admin@zintellect.ai"
                value={formData.email}
                onChange={handleChange}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="password">Master Password</label>
            <div className="relative">
              <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter admin password"
                value={formData.password}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <ShieldCheck size={14} className="text-success-600" />
              Secure sign-in
            </div>
            <button
              onClick={() => { setError(""); setMessage(""); setView("forgot") }}
              className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              Forgot Password?
            </button>
          </div>

          <Button variant="primary" size="lg" className="w-full" onClick={handleLogin} loading={loading}>
            {!loading && "Admin Login"}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {message && (
            <div className="flex items-start gap-2.5 bg-success-50 dark:bg-success-500/10 border border-success-500/20 rounded-lg p-3">
              <AlertCircle size={16} className="text-success-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-success-700 dark:text-success-500">{message}</p>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2.5 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-800 rounded-lg p-3">
              <AlertCircle size={16} className="text-danger-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p>
            </div>
          )}

          <div>
            <label className="label" htmlFor="forgot-email">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="forgot-email"
                type="email"
                placeholder="admin@zintellect.ai"
                value={forgotEmail}
                onChange={(e) => { setForgotEmail(e.target.value); setError(""); setMessage("") }}
                className="input-field pl-10"
              />
            </div>
          </div>

          <Button variant="primary" size="lg" className="w-full" onClick={handleForgotPassword} loading={loading}>
            {!loading && "Send Reset Link"}
          </Button>

          <button
            onClick={() => { setError(""); setMessage(""); setView("login") }}
            className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1"
          >
            <ArrowRight size={14} className="rotate-180" /> Back to Login
          </button>
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-5 border-t border-slate-100 dark:border-navy-800">
        <Lock size={12} />
        Secure administrative portal. All login attempts are monitored.
      </div>
    </AuthLayout>
  )
}