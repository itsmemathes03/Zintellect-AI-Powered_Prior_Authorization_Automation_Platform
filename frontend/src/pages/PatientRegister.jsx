import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Heart, Mail, Key, FileText, Building2, User, ArrowRight, Sparkles, Activity, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react"
import { patientRegister, getProviders } from "../services/api"
import ParticleBackground from "../components/ParticleBackground"

export default function PatientRegister() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [providers, setProviders] = useState([])
  const [formData, setFormData] = useState({
    full_name: "", email: "", password: "", insurance_provider: "", policy_number: "",
  })

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const res = await getProviders()
        setProviders(res.data?.providers || [])
      } catch {
        setProviders([])
      }
    }
    loadProviders()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  const handleRegister = async () => {
    if (!formData.full_name || !formData.email || !formData.password ||
        !formData.insurance_provider || !formData.policy_number) {
      setError("Please fill all fields")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email")
      return
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await patientRegister(formData)
      const data = res.data
      if (data.status === "Success") {
        if (data.access_token) localStorage.setItem("access_token", data.access_token)
        if (data.patient_id) localStorage.setItem("patient_id", data.patient_id)
        if (data.patient_name) localStorage.setItem("patient_name", data.patient_name)
        setError("")
        navigate(data.access_token ? "/patient-dashboard" : "/patient-login")
      } else {
        setError(data.detail || data.message || "Registration failed")
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || "Registration failed. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/30 dark:from-slate-950 dark:via-rose-950/20 dark:to-pink-950/20 relative overflow-hidden">
      <ParticleBackground r={244} g={63} b={94} />
      <div className="absolute top-0 left-0 w-72 h-72 bg-rose-300/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300/10 rounded-full blur-3xl" />

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-10 py-16 relative z-10">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-rose-900 via-pink-900 to-rose-950 rounded-[40px] p-10 xl:p-14 shadow-2xl min-h-[760px] relative overflow-hidden">
            <div className="absolute top-10 left-10 w-44 h-44 bg-rose-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-52 h-52 bg-pink-400/20 rounded-full blur-3xl" />

            <div className="flex justify-center mt-4">
              <div className="w-36 h-36 xl:w-40 xl:h-40 rounded-full bg-gradient-to-br from-rose-600 to-pink-600 border-4 border-rose-400/30 flex items-center justify-center shadow-2xl shadow-rose-900/50 animate-pulse">
                <Heart size={70} className="text-white" />
              </div>
            </div>

            <div className="text-center mt-10">
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
                Get Started with
                <span className="block text-rose-300 mt-2">Smart Healthcare</span>
              </h1>
              <p className="mt-8 text-rose-100/80 text-lg xl:text-xl leading-9">
                Register with your insurance details and get AI-powered prior authorization support.
              </p>
            </div>

            <div className="space-y-5 mt-14">
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-lg p-5 rounded-2xl shadow-lg hover:scale-[1.02] transition-all duration-300">
                <div className="bg-rose-400/20 p-3 rounded-xl border border-rose-400/20">
                  <Sparkles className="text-rose-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI-Assisted Approval</h3>
                  <p className="text-rose-100/60 text-sm">Faster prior authorization decisions</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-lg p-5 rounded-2xl shadow-lg hover:scale-[1.02] transition-all duration-300">
                <div className="bg-pink-400/20 p-3 rounded-xl border border-pink-400/20">
                  <Activity className="text-pink-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Real-Time Tracking</h3>
                  <p className="text-rose-100/60 text-sm">Monitor your request status instantly</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-lg p-5 rounded-2xl shadow-lg hover:scale-[1.02] transition-all duration-300">
                <div className="bg-rose-400/20 p-3 rounded-xl border border-rose-400/20">
                  <ShieldCheck className="text-rose-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Privacy First</h3>
                  <p className="text-rose-100/60 text-sm">Your data is always encrypted</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-rose-100/40 dark:border-rose-900/40 shadow-2xl rounded-[35px] p-6 sm:p-8 md:p-12 lg:p-14 relative overflow-hidden">
            <div className="lg:hidden flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-600 to-pink-600 flex items-center justify-center shadow-2xl">
                <Heart size={45} className="text-white" />
              </div>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-rose-950 dark:text-white leading-tight">
                Patient <span className="text-rose-600 dark:text-rose-400">Registration</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm sm:text-base md:text-lg leading-7 md:leading-8">
                Register with your insurance provider to start using AI-assisted prior authorization services.
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 dark:bg-red-950/50 dark:border-red-900/60">
                <AlertCircle className="text-red-700 dark:text-red-400 flex-shrink-0 mt-1" size={20} />
                <p className="text-red-700 dark:text-red-200 text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block font-bold text-rose-950 dark:text-rose-100 mb-3 text-sm md:text-base">Full Name</label>
              <div className="relative">
                <User className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={22} />
                <input type="text" name="full_name" placeholder="Enter your full name"
                  value={formData.full_name} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 dark:bg-slate-800/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm transition-all text-sm md:text-base text-slate-900" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-bold text-rose-950 dark:text-rose-100 mb-3 text-sm md:text-base">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={22} />
                <input type="email" name="email" placeholder="Enter your email"
                  value={formData.email} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 dark:bg-slate-800/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm transition-all text-sm md:text-base text-slate-900" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-bold text-rose-950 dark:text-rose-100 mb-3 text-sm md:text-base">Password</label>
              <div className="relative">
                <Key className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={22} />
                <input type="password" name="password" placeholder="Minimum 6 characters"
                  value={formData.password} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 dark:bg-slate-800/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm transition-all text-sm md:text-base text-slate-900" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-bold text-rose-950 dark:text-rose-100 mb-3 text-sm md:text-base">Insurance Provider</label>
              <div className="relative">
                <Building2 className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={22} />
                <select name="insurance_provider" value={formData.insurance_provider} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 dark:bg-slate-800/70 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm transition-all text-sm md:text-base text-slate-900 appearance-none">
                  <option value="">Select your insurance provider</option>
                  {providers.map((provider) => (
                    <option key={provider.id || provider.provider_name} value={provider.provider_name}>
                      {provider.provider_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-8">
              <label className="block font-bold text-rose-950 dark:text-rose-100 mb-3 text-sm md:text-base">Policy Number</label>
              <div className="relative">
                <FileText className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={22} />
                <input type="text" name="policy_number" placeholder="Enter your policy number"
                  value={formData.policy_number} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 dark:bg-slate-800/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm transition-all text-sm md:text-base text-slate-900" />
              </div>
            </div>

            <button onClick={handleRegister} disabled={loading}
              className={`w-full rounded-2xl py-4 md:py-5 text-base md:text-lg font-bold text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                loading ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-rose-700 to-pink-600 hover:scale-[1.02] hover:shadow-2xl"
              }`}>
              {loading ? "Creating Account..." : "Register Patient"}
              {!loading && <CheckCircle2 size={20} />}
            </button>

            <div className="flex items-center justify-center gap-1 mt-6">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Already have an account?</p>
              <button onClick={() => navigate("/patient-login")}
                className="text-sm font-bold text-rose-700 dark:text-rose-400 hover:underline">
                Login
              </button>
            </div>

            <div className="mt-8 bg-rose-50 border border-rose-100 rounded-2xl p-4 md:p-5 flex items-start md:items-center gap-4 dark:bg-rose-950/40 dark:border-rose-900/60">
              <ShieldCheck className="text-rose-700 dark:text-rose-300 mt-1 md:mt-0" size={22} />
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-6">
                Your health information is protected with enterprise-grade encryption and HIPAA-compliant practices.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}