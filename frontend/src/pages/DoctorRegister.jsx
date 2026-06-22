import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Stethoscope, Mail, Key, UserRound, Building2, Microscope, IdCard, ArrowRight, AlertCircle, Shield, Activity, Sparkles, BadgeCheck } from "lucide-react"
import ParticleBackground from "../components/ParticleBackground"

export default function DoctorRegister() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", password: "",
    hospital_name: "", specialization: "", license_number: "", phone: ""
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  const handleRegister = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      setError("Name, email, and password are required")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/doctor/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok && data.status === "Success") {
        localStorage.setItem("access_token", data.access_token)
        localStorage.setItem("doctor_id", data.doctor_id)
        localStorage.setItem("doctor_name", data.doctor_name)
        setSuccess("Registration successful! Redirecting...")
        setTimeout(() => navigate("/doctor-dashboard"), 1200)
      } else {
        setError(data.detail || data.message || "Registration failed")
      }
    } catch {
      setError("Registration failed. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-sky-50/30 relative overflow-hidden">
      <ParticleBackground r={6} g={182} b={212} />
      <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-300/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-300/10 rounded-full blur-3xl" />

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-10 py-16 relative z-10">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-cyan-900 via-sky-900 to-cyan-800 rounded-[40px] p-10 xl:p-14 shadow-2xl min-h-[760px] relative overflow-hidden border border-white/10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-sky-400/20 rounded-full blur-3xl" />

            <div className="flex justify-center mt-4 relative z-10">
              <div className="w-36 h-36 xl:w-40 xl:h-40 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl animate-pulse">
                <Stethoscope size={70} className="text-cyan-300" />
              </div>
            </div>

            <div className="text-center mt-10 relative z-10">
              <h1 className="text-5xl xl:text-6xl font-extrabold leading-tight text-white">
                Doctor
                <span className="block text-cyan-300 mt-2">Registration</span>
              </h1>
              <p className="mt-8 text-cyan-100 text-lg xl:text-xl leading-9">
                Join the AI-powered healthcare platform. Submit prior authorization requests and manage patient cases efficiently.
              </p>
            </div>

            <div className="space-y-5 mt-14 relative z-10">
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:scale-[1.02] transition-all duration-300">
                <div className="bg-cyan-400/20 p-3 rounded-xl">
                  <Sparkles className="text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI-Powered Workflows</h3>
                  <p className="text-cyan-100 text-sm">Intelligent prior authorization engine</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:scale-[1.02] transition-all duration-300">
                <div className="bg-green-400/20 p-3 rounded-xl">
                  <BadgeCheck className="text-green-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">HIPAA Compliant</h3>
                  <p className="text-cyan-100 text-sm">Enterprise-grade security & privacy</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:scale-[1.02] transition-all duration-300">
                <div className="bg-sky-400/20 p-3 rounded-xl">
                  <Activity className="text-sky-200" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Real-Time Tracking</h3>
                  <p className="text-cyan-100 text-sm">Monitor authorization status 24/7</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-cyan-100/40 shadow-2xl rounded-[35px] p-6 sm:p-8 md:p-12 lg:p-14 relative overflow-hidden">
            <div className="lg:hidden flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-700 to-sky-700 flex items-center justify-center shadow-2xl">
                <Stethoscope size={45} className="text-cyan-200" />
              </div>
            </div>

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-3 bg-cyan-50 border border-cyan-100 rounded-full px-5 py-2 mb-6">
                <Activity size={18} className="text-cyan-700" />
                <span className="text-sm font-semibold text-cyan-900">Healthcare Professional Registration</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-cyan-950 leading-tight">
                Create Your
                <span className="block text-cyan-600">Account</span>
              </h1>
              <p className="text-slate-500 mt-5 text-sm sm:text-base md:text-lg leading-8">
                Register to access the AI-powered prior authorization dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="text-red-700 flex-shrink-0 mt-1" size={20} />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
                <BadgeCheck className="text-green-700 flex-shrink-0 mt-1" size={20} />
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block font-bold text-cyan-950 mb-3 text-sm">First Name</label>
                <div className="relative">
                  <UserRound className="absolute left-5 top-4 text-slate-400" size={20} />
                  <input type="text" name="first_name" placeholder="First name"
                    value={formData.first_name} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm transition-all text-sm text-slate-900" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-cyan-950 mb-3 text-sm">Last Name</label>
                <div className="relative">
                  <UserRound className="absolute left-5 top-4 text-slate-400" size={20} />
                  <input type="text" name="last_name" placeholder="Last name"
                    value={formData.last_name} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm transition-all text-sm text-slate-900" />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-bold text-cyan-950 mb-3 text-sm">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-4 text-slate-400" size={20} />
                <input type="email" name="email" placeholder="doctor@zintellect.ai"
                  value={formData.email} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm transition-all text-sm text-slate-900" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-bold text-cyan-950 mb-3 text-sm">Password</label>
              <div className="relative">
                <Key className="absolute left-5 top-4 text-slate-400" size={20} />
                <input type="password" name="password" placeholder="Min. 6 characters"
                  value={formData.password} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm transition-all text-sm text-slate-900" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block font-bold text-cyan-950 mb-3 text-sm">Hospital</label>
                <div className="relative">
                  <Building2 className="absolute left-5 top-4 text-slate-400" size={20} />
                  <input type="text" name="hospital_name" placeholder="Hospital name"
                    value={formData.hospital_name} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm transition-all text-sm text-slate-900" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-cyan-950 mb-3 text-sm">Specialization</label>
                <div className="relative">
                  <Microscope className="absolute left-5 top-4 text-slate-400" size={20} />
                  <input type="text" name="specialization" placeholder="e.g. Cardiology"
                    value={formData.specialization} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm transition-all text-sm text-slate-900" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block font-bold text-cyan-950 mb-3 text-sm">License Number</label>
                <div className="relative">
                  <IdCard className="absolute left-5 top-4 text-slate-400" size={20} />
                  <input type="text" name="license_number" placeholder="Medical license"
                    value={formData.license_number} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm transition-all text-sm text-slate-900" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-cyan-950 mb-3 text-sm">Phone</label>
                <div className="relative">
                  <UserRound className="absolute left-5 top-4 text-slate-400" size={20} />
                  <input type="tel" name="phone" placeholder="Phone number"
                    value={formData.phone} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm transition-all text-sm text-slate-900" />
                </div>
              </div>
            </div>

            <button onClick={handleRegister} disabled={loading}
              className={`w-full rounded-2xl py-4 md:py-5 text-base md:text-lg font-bold text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                loading ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-cyan-700 via-sky-600 to-cyan-600 hover:scale-[1.02] hover:shadow-2xl"
              }`}>
              {loading ? "Creating Account..." : "Register as Doctor"}
              {!loading && <ArrowRight size={20} />}
            </button>

            <p className="text-center mt-6 text-slate-500 text-sm">
              Already have an account?{" "}
              <button onClick={() => navigate("/doctor-login")} className="text-cyan-700 font-bold hover:underline">
                Sign in
              </button>
            </p>

            <div className="mt-8 bg-cyan-50 border border-cyan-100 rounded-2xl p-4 md:p-5 flex items-start md:items-center gap-4">
              <Shield className="text-cyan-700 mt-1 md:mt-0" size={22} />
              <p className="text-slate-600 text-xs sm:text-sm leading-6">
                Your credentials are securely encrypted. All access is logged for compliance.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
