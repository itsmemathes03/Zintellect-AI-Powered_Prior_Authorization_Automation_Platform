import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Stethoscope, Mail, Key, Building2, GraduationCap, BadgeCheck, Phone, Activity, Sparkles, CheckCircle2, AlertCircle, User, ShieldCheck } from "lucide-react"
import { doctorRegister } from "../services/api"
import ParticleBackground from "../components/ParticleBackground"

export default function DoctorRegister() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    full_name: "", email: "", password: "",
    hospital: "", specialization: "", license_number: "", phone: "",
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
    setSuccess("")
  }

  const handleRegister = async () => {
    if (!formData.full_name || !formData.email || !formData.password ||
        !formData.hospital || !formData.specialization || !formData.license_number || !formData.phone) {
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
      const res = await doctorRegister(formData)
      const data = res.data
      if (data.status === "Success") {
        if (data.access_token) localStorage.setItem("access_token", data.access_token)
        if (data.doctor_id) localStorage.setItem("doctor_id", data.doctor_id)
        if (data.doctor_name) localStorage.setItem("doctor_name", data.doctor_name)
        setSuccess("Registration successful! Redirecting...")
        setTimeout(() => navigate("/doctor-dashboard"), 1200)
      } else {
        setError(data.detail || data.message || "Registration failed")
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || "Registration failed. Please try again.")
    }
    setLoading(false)
  }

  const inputClass = "w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm transition-all text-sm md:text-base text-slate-900 dark:bg-slate-800/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-sky-50/30 dark:from-slate-950 dark:via-cyan-950/20 dark:to-sky-950/20 relative overflow-hidden">
      <ParticleBackground r={56} g={189} b={248} />
      <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-300/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-300/10 rounded-full blur-3xl" />

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-10 py-16 relative z-10">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-cyan-900 via-sky-900 to-cyan-950 rounded-[40px] p-10 xl:p-14 shadow-2xl min-h-[760px] relative overflow-hidden">
            <div className="absolute top-10 left-10 w-44 h-44 bg-cyan-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-52 h-52 bg-sky-400/20 rounded-full blur-3xl" />

            <div className="flex justify-center mt-4">
              <div className="w-36 h-36 xl:w-40 xl:h-40 rounded-full bg-gradient-to-br from-cyan-600 to-sky-600 border-4 border-cyan-400/30 flex items-center justify-center shadow-2xl shadow-cyan-900/50 animate-pulse">
                <Stethoscope size={70} className="text-white" />
              </div>
            </div>

            <div className="text-center mt-10">
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
                Join as a Smart
                <span className="block text-cyan-300 mt-2">Medical Professional</span>
              </h1>
              <p className="mt-8 text-cyan-100/80 text-lg xl:text-xl leading-9">
                Create your account and streamline prior authorization requests with AI-powered clinical decision support.
              </p>
            </div>

            <div className="space-y-5 mt-14">
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-lg p-5 rounded-2xl shadow-lg hover:scale-[1.02] transition-all duration-300">
                <div className="bg-cyan-400/20 p-3 rounded-xl border border-cyan-400/20">
                  <Stethoscope className="text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI-Assisted Workflows</h3>
                  <p className="text-cyan-100/60 text-sm">Reduce review time with intelligent automation</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-lg p-5 rounded-2xl shadow-lg hover:scale-[1.02] transition-all duration-300">
                <div className="bg-sky-400/20 p-3 rounded-xl border border-sky-400/20">
                  <Sparkles className="text-sky-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Clinical Intelligence</h3>
                  <p className="text-cyan-100/60 text-sm">Evidence-based decisions at your fingertips</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-lg p-5 rounded-2xl shadow-lg hover:scale-[1.02] transition-all duration-300">
                <div className="bg-cyan-400/20 p-3 rounded-xl border border-cyan-400/20">
                  <CheckCircle2 className="text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">HIPAA Compliant</h3>
                  <p className="text-cyan-100/60 text-sm">Enterprise-grade healthcare security</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-cyan-100/40 dark:border-cyan-900/40 shadow-2xl rounded-[35px] p-6 sm:p-8 md:p-12 lg:p-14 relative overflow-hidden">
            <div className="flex justify-center mb-8">
              <div className="bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-100 dark:border-cyan-900/60 rounded-full px-5 py-2 flex items-center gap-2">
                <Activity className="text-cyan-700 dark:text-cyan-300" size={18} />
                <span className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">HIPAA Compliant Platform</span>
              </div>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cyan-950 dark:text-white leading-tight">
                Create Doctor <span className="text-cyan-600 dark:text-cyan-400">Account</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-5 text-sm sm:text-base md:text-lg leading-8">
                Register as a medical professional to submit AI-powered prior authorization requests.
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 dark:bg-red-950/50 dark:border-red-900/60">
                <AlertCircle className="text-red-700 dark:text-red-400 flex-shrink-0 mt-1" size={20} />
                <p className="text-red-700 dark:text-red-200 text-sm font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3 dark:bg-green-950/50 dark:border-green-900/60">
                <CheckCircle2 className="text-green-700 dark:text-green-400 flex-shrink-0 mt-1" size={20} />
                <p className="text-green-700 dark:text-green-200 text-sm font-medium">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block font-bold text-cyan-950 dark:text-cyan-100 mb-3 text-sm">Full Name</label>
                <div className="relative">
                  <User className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={20} />
                  <input type="text" name="full_name" placeholder="Enter full name"
                    value={formData.full_name} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block font-bold text-cyan-950 dark:text-cyan-100 mb-3 text-sm">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={20} />
                  <input type="email" name="email" placeholder="Enter email"
                    value={formData.email} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block font-bold text-cyan-950 dark:text-cyan-100 mb-3 text-sm">Password</label>
                <div className="relative">
                  <Key className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={20} />
                  <input type="password" name="password" placeholder="Minimum 6 characters"
                    value={formData.password} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block font-bold text-cyan-950 dark:text-cyan-100 mb-3 text-sm">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={20} />
                  <input type="tel" name="phone" placeholder="Enter phone number"
                    value={formData.phone} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block font-bold text-cyan-950 dark:text-cyan-100 mb-3 text-sm">Hospital</label>
                <div className="relative">
                  <Building2 className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={20} />
                  <input type="text" name="hospital" placeholder="Enter hospital"
                    value={formData.hospital} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block font-bold text-cyan-950 dark:text-cyan-100 mb-3 text-sm">Specialization</label>
                <div className="relative">
                  <GraduationCap className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={20} />
                  <input type="text" name="specialization" placeholder="Enter specialization"
                    value={formData.specialization} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-cyan-950 dark:text-cyan-100 mb-3 text-sm">Medical License Number</label>
                <div className="relative">
                  <BadgeCheck className="absolute left-5 top-5 text-slate-400 dark:text-slate-500" size={20} />
                  <input type="text" name="license_number" placeholder="Enter medical license number"
                    value={formData.license_number} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>

            <button onClick={handleRegister} disabled={loading}
              className={`w-full mt-8 rounded-2xl py-4 md:py-5 text-base md:text-lg font-bold text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                loading ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-cyan-700 to-sky-600 hover:scale-[1.02] hover:shadow-2xl"
              }`}>
              {loading ? "Creating Account..." : "Register Doctor"}
              {!loading && <Sparkles size={20} />}
            </button>

            <div className="flex items-center justify-center gap-1 mt-6">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Already have an account?</p>
              <button onClick={() => navigate("/doctor-login")}
                className="text-sm font-bold text-cyan-700 dark:text-cyan-400 hover:underline">
                Login
              </button>
            </div>

            <div className="mt-8 bg-cyan-50 border border-cyan-100 rounded-2xl p-4 md:p-5 flex items-start md:items-center gap-4 dark:bg-cyan-950/40 dark:border-cyan-900/60">
              <ShieldCheck className="text-cyan-700 dark:text-cyan-300 mt-1 md:mt-0" size={22} />
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-6">
                Your medical credentials and patient data are protected with enterprise-grade healthcare compliance systems.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}