import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Stethoscope, Mail, Key, ArrowRight, AlertCircle } from "lucide-react"
import { doctorLogin } from "../services/api"
import ParticleBackground from "../components/ParticleBackground"

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-sky-50/30 relative overflow-hidden">
      <ParticleBackground r={6} g={182} b={212} />
      <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-300/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-300/10 rounded-full blur-3xl" />

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-10 py-16 relative z-10">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          <div className="hidden lg:flex flex-col justify-between bg-white/80 backdrop-blur-2xl border border-cyan-100/50 rounded-[40px] p-10 xl:p-14 shadow-2xl min-h-[760px] relative overflow-hidden">
            <div className="absolute top-10 left-10 w-44 h-44 bg-cyan-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-52 h-52 bg-sky-400/20 rounded-full blur-3xl" />

            <div className="flex justify-center mt-4">
              <div className="w-36 h-36 xl:w-40 xl:h-40 rounded-full bg-gradient-to-br from-cyan-600 to-sky-600 flex items-center justify-center shadow-2xl shadow-cyan-200 animate-pulse">
                <Stethoscope size={70} className="text-white" />
              </div>
            </div>

            <div className="text-center mt-10">
              <h1 className="text-4xl xl:text-5xl font-extrabold text-cyan-950 leading-tight">
                Doctor <span className="block text-cyan-600 mt-2">Portal</span>
              </h1>
              <p className="mt-8 text-slate-600 text-lg xl:text-xl leading-9">
                Submit prior authorization requests, track patient cases, and manage medical documentation.
              </p>
            </div>

            <div className="space-y-5 mt-14">
              <div className="flex items-center gap-5 bg-white/70 backdrop-blur-lg p-5 rounded-2xl shadow-md hover:scale-[1.02] transition-all">
                <div className="bg-cyan-100 p-3 rounded-xl">
                  <Stethoscope className="text-cyan-700" />
                </div>
                <div>
                  <h3 className="font-bold text-cyan-950">Request Management</h3>
                  <p className="text-slate-500 text-sm">Submit and track prior auth requests</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/70 backdrop-blur-lg p-5 rounded-2xl shadow-md hover:scale-[1.02] transition-all">
                <div className="bg-sky-100 p-3 rounded-xl">
                  <AlertCircle className="text-sky-700" />
                </div>
                <div>
                  <h3 className="font-bold text-cyan-950">Patient Records</h3>
                  <p className="text-slate-500 text-sm">Access patient insurance and history</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-cyan-100/40 shadow-2xl rounded-[35px] p-6 sm:p-8 md:p-12 lg:p-14 relative overflow-hidden">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cyan-950 leading-tight">
                Doctor <span className="text-cyan-600">Login</span>
              </h1>
              <p className="text-slate-500 mt-4 text-sm sm:text-base md:text-lg leading-7">
                Sign in to access your dashboard and manage requests.
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="text-red-700 flex-shrink-0 mt-1" size={20} />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block font-bold text-cyan-950 mb-3 text-sm md:text-base">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-5 text-slate-400" size={22} />
                <input type="email" name="email" placeholder="doctor@zintellect.ai"
                  value={formData.email} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm transition-all text-sm md:text-base text-slate-900" />
              </div>
            </div>

            <div className="mb-8">
              <label className="block font-bold text-cyan-950 mb-3 text-sm md:text-base">Password</label>
              <div className="relative">
                <Key className="absolute left-5 top-5 text-slate-400" size={22} />
                <input type="password" name="password" placeholder="Enter your password"
                  value={formData.password} onChange={handleChange}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm transition-all text-sm md:text-base text-slate-900" />
              </div>
            </div>

            <button onClick={handleLogin} disabled={loading}
              className={`w-full rounded-2xl py-4 md:py-5 text-base md:text-lg font-bold text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                loading ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-cyan-700 to-sky-600 hover:scale-[1.02] hover:shadow-2xl"
              }`}>
              {loading ? "Authenticating..." : "Doctor Login"}
              {!loading && <ArrowRight size={20} />}
            </button>

            <p className="text-center mt-6 text-slate-500 text-sm">
              Don't have an account?{" "}
              <button onClick={() => navigate("/doctor-register")} className="text-cyan-700 font-bold hover:underline">
                Register here
              </button>
            </p>

            <div className="mt-6 bg-cyan-50 border border-cyan-100 rounded-2xl p-4 md:p-5 flex items-start md:items-center gap-4">
              <Key className="text-cyan-700 mt-1 md:mt-0" size={22} />
              <p className="text-slate-600 text-xs sm:text-sm leading-6">
                Secure portal for healthcare professionals. All access is logged.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
