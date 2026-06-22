import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, Heart, ShieldCheck, ArrowRight, Activity, Sparkles, CheckCircle2, Brain, HeartPulse, AlertCircle } from "lucide-react"
import ParticleBackground from "../components/ParticleBackground"

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/30 relative overflow-hidden">
      <ParticleBackground r={244} g={63} b={94} />
      <div className="absolute top-0 left-0 w-72 h-72 bg-rose-300/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300/10 rounded-full blur-3xl" />

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-10 py-16 relative z-10">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-rose-900 via-pink-900 to-rose-800 rounded-[40px] p-10 xl:p-14 shadow-2xl min-h-[760px] relative overflow-hidden border border-white/10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-rose-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl" />

            <div className="flex justify-center mt-4 relative z-10">
              <div className="w-36 h-36 xl:w-40 xl:h-40 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl animate-pulse">
                <HeartPulse size={70} className="text-rose-300" />
              </div>
            </div>

            <div className="text-center mt-10 relative z-10">
              <h1 className="text-5xl xl:text-6xl font-extrabold leading-tight text-white">
                Welcome Back
                <span className="block text-rose-300 mt-2">Patient Portal</span>
              </h1>
              <p className="mt-8 text-rose-100 text-lg xl:text-xl leading-9">
                Access your healthcare authorization status, view insurance details, and track prior authorization requests in real-time.
              </p>
            </div>

            <div className="space-y-5 mt-14 relative z-10">
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:scale-[1.02] transition-all duration-300">
                <div className="bg-rose-400/20 p-3 rounded-xl">
                  <Sparkles className="text-rose-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Real-time Status</h3>
                  <p className="text-rose-100 text-sm">Track authorization requests instantly</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:scale-[1.02] transition-all duration-300">
                <div className="bg-green-400/20 p-3 rounded-xl">
                  <CheckCircle2 className="text-green-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Insurance Dashboard</h3>
                  <p className="text-rose-100 text-sm">View coverage and policy details</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:scale-[1.02] transition-all duration-300">
                <div className="bg-pink-400/20 p-3 rounded-xl">
                  <Brain className="text-pink-200" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI-Powered Insights</h3>
                  <p className="text-rose-100 text-sm">Intelligent healthcare guidance</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-rose-100/40 shadow-2xl rounded-[35px] p-6 sm:p-8 md:p-12 lg:p-14 relative overflow-hidden">
            <div className="lg:hidden flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-700 to-pink-700 flex items-center justify-center shadow-2xl">
                <Heart size={45} className="text-rose-200" />
              </div>
            </div>

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-full px-5 py-2 mb-6">
                <Activity size={18} className="text-rose-700" />
                <span className="text-sm font-semibold text-rose-900">Patient Login</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-rose-950 leading-tight">
                Patient
                <span className="block text-rose-600">Login</span>
              </h1>
              <p className="text-slate-500 mt-5 text-sm sm:text-base md:text-lg leading-8">
                Sign in to access your insurance dashboard and authorization requests.
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="text-red-700 flex-shrink-0 mt-1" size={20} />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block font-bold text-rose-950 mb-3">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-5 text-slate-400" size={22} />
                <input type="email" name="email" placeholder="Enter your email"
                  value={formData.email} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm transition-all text-slate-900" />
              </div>
            </div>

            <div className="mb-8">
              <label className="block font-bold text-rose-950 mb-3">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-5 text-slate-400" size={22} />
                <input type="password" name="password" placeholder="Enter your password"
                  value={formData.password} onChange={handleChange}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm transition-all text-slate-900" />
              </div>
            </div>

            <button onClick={handleLogin} disabled={loading}
              className={`w-full rounded-2xl py-4 md:py-5 text-base md:text-lg font-bold text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                loading ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-rose-800 via-pink-700 to-rose-700 hover:scale-[1.02] hover:shadow-2xl"
              }`}>
              {loading ? "Signing In..." : "Patient Login"}
              {!loading && <ArrowRight size={20} />}
            </button>

            <button onClick={() => navigate("/patient-register")}
              className="w-full mt-5 border border-rose-200 bg-white hover:bg-rose-50 rounded-2xl py-4 md:py-5 text-rose-950 font-bold transition-all duration-300">
              New Patient? Register Here
            </button>

            <div className="mt-8 bg-rose-50 border border-rose-100 rounded-2xl p-4 md:p-5 flex items-start md:items-center gap-4">
              <ShieldCheck className="text-rose-700 mt-1 md:mt-0" size={22} />
              <p className="text-slate-600 text-xs sm:text-sm leading-6">
                Your healthcare data is securely protected. Sign in with your registered email and password.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
