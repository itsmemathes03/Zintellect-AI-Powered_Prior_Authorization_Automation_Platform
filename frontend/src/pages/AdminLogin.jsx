import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Lock, Mail, ShieldAlert, ArrowRight, Key, AlertCircle, ArrowLeft } from "lucide-react"
import { adminLogin, adminForgotPassword } from "../services/api"

export default function AdminLogin() {
  const navigate = useNavigate()
  const [view, setView] = useState("login") // login | forgot | reset
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
      setError("Please fill all fields")
      return
    }
    setLoading(true)
    setError("")
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
    setError("")
    try {
      const res = await adminForgotPassword({ email: forgotEmail })
      setMessage(res.data.message || "If the email exists, a reset link has been sent")
      setError("")
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to process request")
    }
    setLoading(false)
  }

  const inputClass = "w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white dark:bg-slate-800/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-400 shadow-sm transition-all text-sm md:text-base text-slate-900"

  const renderLogin = () => (
    <>
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-red-950 dark:text-white leading-tight">
          Admin<span className="text-orange-600 dark:text-orange-400"> Login</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm sm:text-base md:text-lg leading-7">
          Access the administrative dashboard with secure authentication.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 dark:bg-red-950/50 dark:border-red-900/60">
          <AlertCircle className="text-red-700 dark:text-red-400 flex-shrink-0 mt-1" size={20} />
          <p className="text-red-700 dark:text-red-200 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <label className="block font-bold text-red-950 dark:text-red-100 mb-3 text-sm md:text-base">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={22} />
          <input type="email" name="email" placeholder="admin@zintellect.ai"
            value={formData.email} onChange={handleChange}
            className={inputClass} />
        </div>
      </div>

      <div className="mb-4">
        <label className="block font-bold text-red-950 dark:text-red-100 mb-3 text-sm md:text-base">Master Password</label>
        <div className="relative">
          <Key className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={22} />
          <input type="password" name="password" placeholder="Enter admin password"
            value={formData.password} onChange={handleChange}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className={inputClass} />
        </div>
      </div>

      <div className="mb-8 text-right">
        <button onClick={() => { setError(""); setMessage(""); setView("forgot") }}
          className="text-sm font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 hover:underline">
          Forgot Password?
        </button>
      </div>

      <button onClick={handleLogin} disabled={loading}
        className={`w-full rounded-2xl py-4 md:py-5 text-base md:text-lg font-bold text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
          loading ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-red-700 to-orange-600 hover:scale-[1.02] hover:shadow-2xl"
        }`}>
        {loading ? "Authenticating..." : "Admin Login"}
        {!loading && <ArrowRight size={20} />}
      </button>
    </>
  )

  const renderForgotPassword = () => (
    <>
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-red-950 dark:text-white leading-tight">
          Reset<span className="text-orange-600 dark:text-orange-400"> Password</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm sm:text-base md:text-lg leading-7">
          Enter your email to receive a password reset link.
        </p>
      </div>

      {message && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 dark:bg-emerald-950/50 dark:border-emerald-900/60">
          <AlertCircle className="text-emerald-700 dark:text-emerald-400 flex-shrink-0 mt-1" size={20} />
          <p className="text-emerald-700 dark:text-emerald-200 text-sm font-medium">{message}</p>
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 dark:bg-red-950/50 dark:border-red-900/60">
          <AlertCircle className="text-red-700 dark:text-red-400 flex-shrink-0 mt-1" size={20} />
          <p className="text-red-700 dark:text-red-200 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="mb-8">
        <label className="block font-bold text-red-950 dark:text-red-100 mb-3 text-sm md:text-base">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={22} />
          <input type="email" placeholder="admin@zintellect.ai"
            value={forgotEmail} onChange={(e) => { setForgotEmail(e.target.value); setError(""); setMessage("") }}
            className={inputClass} />
        </div>
      </div>

      <button onClick={handleForgotPassword} disabled={loading}
        className={`w-full rounded-2xl py-4 md:py-5 text-base md:text-lg font-bold text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
          loading ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-red-700 to-orange-600 hover:scale-[1.02] hover:shadow-2xl"
        }`}>
        {loading ? "Sending..." : "Send Reset Link"}
        {!loading && <ArrowRight size={20} />}
      </button>

      <div className="mt-8 text-center">
        <button onClick={() => { setError(""); setMessage(""); setView("login") }}
          className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 flex items-center justify-center gap-2 mx-auto">
          <ArrowLeft size={16} /> Back to Login
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-red-50 to-orange-100 dark:from-slate-950 dark:via-red-950/20 dark:to-orange-950/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-red-300/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl"></div>

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-10 py-16">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* LEFT PANEL */}
          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-red-100 via-orange-100 to-red-100 dark:from-red-950/60 dark:via-orange-950/40 dark:to-red-950/60 rounded-[40px] p-10 xl:p-14 shadow-2xl border border-red-200/50 dark:border-red-900/50 backdrop-blur-xl min-h-[760px] relative overflow-hidden">
            <div className="absolute top-10 left-10 w-44 h-44 bg-red-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-52 h-52 bg-orange-400/20 rounded-full blur-3xl" />

            <div className="flex justify-center mt-4">
              <div className="w-36 h-36 xl:w-40 xl:h-40 rounded-full bg-gradient-to-br from-red-700 to-orange-600 flex items-center justify-center shadow-2xl animate-pulse">
                <ShieldAlert size={70} className="text-white" />
              </div>
            </div>

            <div className="text-center mt-10">
              <h1 className="text-4xl xl:text-5xl font-extrabold text-red-950 dark:text-white leading-tight">
                Administrative<span className="block text-orange-600 dark:text-orange-400 mt-2">Control Center</span>
              </h1>
              <p className="mt-8 text-red-900 dark:text-red-200/80 text-lg xl:text-xl leading-9">
                Manage platform operations, monitor system performance, and oversee all healthcare authorization workflows.
              </p>
            </div>

            <div className="space-y-5 mt-14">
              <div className="flex items-center gap-5 bg-white/70 dark:bg-red-950/40 backdrop-blur-lg p-5 rounded-2xl shadow-md hover:scale-[1.02] transition-all">
                <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-xl"><ShieldAlert className="text-red-700 dark:text-red-300" /></div>
                <div><h3 className="font-bold text-red-950 dark:text-white">System Control</h3><p className="text-red-700 dark:text-red-300 text-sm">Full platform management access</p></div>
              </div>
              <div className="flex items-center gap-5 bg-white/70 dark:bg-red-950/40 backdrop-blur-lg p-5 rounded-2xl shadow-md hover:scale-[1.02] transition-all">
                <div className="bg-orange-100 dark:bg-orange-900/50 p-3 rounded-xl"><AlertCircle className="text-orange-700 dark:text-orange-300" /></div>
                <div><h3 className="font-bold text-red-950 dark:text-white">Real-time Monitoring</h3><p className="text-red-700 dark:text-red-300 text-sm">Track all system activities and alerts</p></div>
              </div>
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 backdrop-blur-2xl shadow-2xl rounded-[35px] p-6 sm:p-8 md:p-12 lg:p-14 relative overflow-hidden">
            {view === "login" && renderLogin()}
            {view === "forgot" && renderForgotPassword()}

            <div className="mt-8 bg-red-50 border border-red-100 rounded-2xl p-4 md:p-5 flex items-start md:items-center gap-4 dark:bg-red-950/40 dark:border-red-900/60">
              <Lock className="text-red-700 dark:text-red-300 mt-1 md:mt-0" size={22} />
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-6">
                This is a secure administrative portal. All login attempts are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}