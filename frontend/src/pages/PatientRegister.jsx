import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { UserRound, Mail, Lock, ShieldCheck, Activity, Sparkles, HeartPulse, CheckCircle2, ArrowRight, Brain, Stethoscope, BadgeCheck, AlertCircle } from "lucide-react"
import ParticleBackground from "../components/ParticleBackground"

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
      } catch (error) { console.log(error) }
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
        setError(data.detail || data.message || "Registration failed")
      }
    } catch {
      setError("Patient registration failed. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/30 relative overflow-hidden">
      <ParticleBackground r={244} g={63} b={94} />
      <div className="absolute top-0 left-0 w-96 h-96 bg-rose-300/10 rounded-full blur-3xl" />
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
                Smart Patient
                <span className="block text-rose-300 mt-2">Registration</span>
              </h1>
              <p className="mt-8 text-rose-100 text-lg xl:text-xl leading-9">
                Register patients instantly with AI-powered insurance validation, secure workflows, and intelligent healthcare authorization systems.
              </p>
            </div>

            <div className="space-y-5 mt-14 relative z-10">
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:scale-[1.02] transition-all duration-300">
                <div className="bg-rose-400/20 p-3 rounded-xl">
                  <Sparkles className="text-rose-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI Registration Engine</h3>
                  <p className="text-rose-100 text-sm">Faster patient onboarding workflows</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:scale-[1.02] transition-all duration-300">
                <div className="bg-green-400/20 p-3 rounded-xl">
                  <CheckCircle2 className="text-green-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Secure Healthcare Access</h3>
                  <p className="text-rose-100 text-sm">Protected insurance registration system</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:scale-[1.02] transition-all duration-300">
                <div className="bg-pink-400/20 p-3 rounded-xl">
                  <Brain className="text-pink-200" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Intelligent Verification</h3>
                  <p className="text-rose-100 text-sm">Real-time AI insurance validation</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-rose-100/40 shadow-2xl rounded-[35px] p-6 sm:p-8 md:p-12 lg:p-14 relative overflow-hidden">
            <div className="lg:hidden flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-700 to-pink-700 flex items-center justify-center shadow-2xl">
                <Stethoscope size={45} className="text-rose-200" />
              </div>
            </div>

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-full px-5 py-2 mb-6">
                <Activity size={18} className="text-rose-700" />
                <span className="text-sm font-semibold text-rose-900">AI Healthcare Registration</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-rose-950 leading-tight">
                Patient
                <span className="block text-rose-600">Registration</span>
              </h1>
              <p className="text-slate-500 mt-5 text-sm sm:text-base md:text-lg leading-8">
                Register for AI-powered healthcare insurance and real-time prior authorization services.
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="text-red-700 flex-shrink-0 mt-1" size={20} />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
                <BadgeCheck className="text-green-600 mt-1" size={24} />
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block font-bold text-rose-950 mb-3">Patient Name</label>
              <div className="relative">
                <UserRound className="absolute left-5 top-5 text-slate-400" size={22} />
                <input type="text" name="patient_name" placeholder="Enter patient name"
                  value={formData.patient_name} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm transition-all text-slate-900" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-bold text-rose-950 mb-3">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-5 text-slate-400" size={22} />
                <input type="email" name="email" placeholder="Enter patient email"
                  value={formData.email} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm transition-all text-slate-900" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-bold text-rose-950 mb-3">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-5 text-slate-400" size={22} />
                <input type="password" name="password" placeholder="Create password (min. 6 characters)"
                  value={formData.password} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm transition-all text-slate-900" />
              </div>
            </div>

            <div className="mb-8">
              <label className="block font-bold text-rose-950 mb-3">Insurance Provider</label>
              <div className="relative">
                <ShieldCheck className="absolute left-5 top-5 text-slate-400 z-10" size={22} />
                <select name="insurance_provider" value={formData.insurance_provider} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm transition-all appearance-none text-slate-900">
                  <option value="">Select Insurance Provider</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.provider_name}>{provider.provider_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={handleRegister} disabled={loading}
              className={`w-full rounded-2xl py-4 md:py-5 text-base md:text-lg font-bold text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                loading ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-rose-800 via-pink-700 to-rose-700 hover:scale-[1.02] hover:shadow-2xl"
              }`}>
              {loading ? "Registering..." : "Register Patient"}
              {!loading && <ArrowRight size={20} />}
            </button>

            <p className="text-center mt-6 text-slate-500 text-sm">
              Already have an account?{" "}
              <button onClick={() => navigate("/patient-login")} className="text-rose-700 font-bold hover:underline">
                Sign in
              </button>
            </p>

            <div className="mt-6 bg-rose-50 border border-rose-100 rounded-2xl p-4 md:p-5 flex items-start md:items-center gap-4">
              <ShieldCheck className="text-rose-700 mt-1 md:mt-0" size={22} />
              <p className="text-slate-600 text-xs sm:text-sm leading-6">
                Your healthcare registration data is securely protected using enterprise AI healthcare authorization systems.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
