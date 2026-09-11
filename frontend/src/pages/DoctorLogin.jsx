import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Stethoscope, Mail, Key, ArrowRight, AlertCircle, Sparkles, CheckCircle2, Activity, ShieldCheck } from "lucide-react"
import { doctorLogin } from "../services/api"
import ParticleBackground from "../components/ParticleBackground"

export default function DoctorLogin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({ email: "", password: "" })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError("Please fill all fields")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await doctorLogin({ email: formData.email, password: formData.password })
      const data = res.data
      if (data.status === "Success") {
        if (data.access_token) localStorage.setItem("access_token", data.access_token)
        if (data.doctor_id) localStorage.setItem("doctor_id", data.doctor_id)
        if (data.doctor_name) localStorage.setItem("doctor_name", data.doctor_name)
        if (data.doctor?.id) localStorage.setItem("doctor_id", data.doctor.id)
        if (data.doctor?.full_name) localStorage.setItem("doctor_name", data.doctor.full_name)
        navigate("/doctor-dashboard")
      } else {
        setError(data.detail || data.message || "Login failed")
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid credentials. Please try again.")
      } else {
        setError(err.response?.data?.detail || err.response?.data?.message || "Login Failed")
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-sky-50/30 dark:from-slate-950 dark:via-cyan-950/20 dark:to-sky-950/20 relative overflow-hidden">
      <ParticleBackground r={56} g={189} b={248} />
      <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-300/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-300/10 rounded-full blur-3xl" />

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-10 py-16 relative z-10">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          <div className="hidden lg:flex flex-col justify-between bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl border border-cyan-100/50 dark:border-cyan-900/50 rounded-[40px] p-10 xl:p-14 shadow-2xl min-h-[760px] relative overflow-hidden">
            <div className="absolute top-10 left-10 w-44 h-44 bg-cyan-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-52 h-52 bg-sky-400/20 rounded-full blur-3xl" />

            <div className="flex justify-center mt-4">
              <div className="w-36 h-36 xl:w-40 xl:h-40 rounded-full bg-gradient-to-br from-cyan-600 to-sky-600 flex items-center justify-center shadow-2xl shadow-cyan-200 animate-pulse">
                <Stethoscope size={70} className="text-white" />
              </div>
            </div>

            <div className="text-center mt-10">
              <h1 className="text-4xl xl:text-5xl font-extrabold text-cyan-950 dark:text-white leading-tight">
                Welcome Back to
                <span className="block text-cyan-600 dark:text-cyan-400 mt-2">Smart Prior Authorization</span>
              </h1>
              <p className="mt-8 text-slate-600 dark:text-slate-300 text-lg xl:text-xl leading-9">
                Access your clinical dashboard and manage AI-powered prior authorization requests securely.
              </p>
            </div>

            <div className="space-y-5 mt-14">
              <div className="flex items-center gap-5 bg-white/70 dark:bg-slate-800/60 backdrop-blur-lg p-5 rounded-2xl shadow-md hover:scale-[1.02] transition-all duration-300">
                <div className="bg-cyan-100 dark:bg-cyan-900/50 p-3 rounded-xl">
                  <Sparkles className="text-cyan-700 dark:text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-bold text-cyan-950 dark:text-white">AI Decision Engine</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Faster, evidence-based approvals</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/70 dark:bg-slate-800/60 backdrop-blur-lg p-5 rounded-2xl shadow-md hover:scale-[1.02] transition-all duration-300">
                <div className="bg-sky-100 dark:bg-sky-900/50 p-3 rounded-xl">
                  <Activity className="text-sky-700 dark:text-sky-300" />
                </div>
                <div>
                  <h3 className="font-bold text-cyan-950 dark:text-white">Real-time Tracking</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Patient request status at a glance</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/70 dark:bg-slate-800/60 backdrop-blur-lg p-5 rounded-2xl shadow-md hover:scale-[1.02] transition-all duration-300">
                <div className="bg-cyan-100 dark:bg-cyan-900/50 p-3 rounded-xl">
                  <ShieldCheck className="text-cyan-700 dark:text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-bold text-cyan-950 dark:text-white">HIPAA Secure</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Enterprise healthcare security</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-cyan-100/40 dark:border-cyan-900/40 shadow-2xl rounded-[35px] p-6 sm:p-8 md:p-12 lg:p-14 relative overflow-hidden">
            <div className="lg:hidden flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-600 to-sky-600 flex items-center justify-center shadow-2xl">
                <Stethoscope size={45} className="text-white" />
              </div>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cyan-950 dark:text-white leading-tight">
                Doctor <span className="text-cyan-600 dark:text-cyan-400">Login</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm sm:text-base md:text-lg leading-7 md:leading-8">
                Access your medical dashboard and manage authorization requests with AI-powered insights.
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 dark:bg-red-950/50 dark:border-red-900/60">
                <AlertCircle className="text-red-700 dark:text-red-400 flex-shrink-0 mt-1" size={20} />
                <p className="text-red-700 dark:text-red-200 text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block font-bold text-cyan-950 dark:text-cyan-100 mb-3 text-sm md:text-base">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={22} />
                <input type="email" name="email" placeholder="Enter doctor email"
                  value={formData.email} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 dark:bg-slate-800/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm transition-all text-sm md:text-base text-slate-900" />
              </div>
            </div>

            <div className="mb-8">
              <label className="block font-bold text-cyan-950 dark:text-cyan-100 mb-3 text-sm md:text-base">Password</label>
              <div className="relative">
                <Key className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={22} />
                <input type="password" name="password" placeholder="Enter secure password"
                  value={formData.password} onChange={handleChange}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 dark:bg-slate-800/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm transition-all text-sm md:text-base text-slate-900" />
              </div>
            </div>

            <button onClick={handleLogin} disabled={loading}
              className={`w-full rounded-2xl py-4 md:py-5 text-base md:text-lg font-bold text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                loading ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-cyan-700 to-sky-600 hover:scale-[1.02] hover:shadow-2xl"
              }`}>
              {loading ? "Signing In..." : "Doctor Login"}
              {!loading && <ArrowRight size={20} />}
            </button>

            <div className="flex items-center justify-center gap-1 mt-6">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">New to Zintellect?</p>
              <button onClick={() => navigate("/doctor-register")}
                className="text-sm font-bold text-cyan-700 dark:text-cyan-400 hover:underline">
                Register
              </button>
            </div>

            <div className="mt-8 bg-cyan-50 border border-cyan-100 rounded-2xl p-4 md:p-5 flex items-start md:items-center gap-4 dark:bg-cyan-950/40 dark:border-cyan-900/60">
              <CheckCircle2 className="text-cyan-700 dark:text-cyan-300 mt-1 md:mt-0" size={22} />
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-6">
                Your medical credentials and patient data are protected with enterprise-grade healthcare security.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}