import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { ShieldCheck, Mail, Lock, ArrowRight, Sparkles, Activity, CheckCircle2, Building2 } from "lucide-react"
import ParticleBackground from "../components/ParticleBackground"

export default function ProviderLogin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      alert("Please fill all fields");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/provider-login`, {
        email: formData.email, password: formData.password,
      });
      if (response.data.status === "Success") {
        localStorage.setItem("provider_id", response.data.provider_id);
        localStorage.setItem("provider_name", response.data.provider_name);
        localStorage.setItem("access_token", response.data.access_token);
        navigate("/provider-dashboard");
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        alert("Invalid credentials. Please try again.");
      } else {
        alert(error.response?.data?.detail || error.response?.data?.message || "Login Failed");
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 relative overflow-hidden">
      <ParticleBackground r={16} g={185} b={129} />
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-300/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl" />

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-10 py-16 relative z-10">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          <div className="hidden lg:flex flex-col justify-between bg-white/80 backdrop-blur-2xl border border-emerald-100/50 rounded-[40px] p-10 xl:p-14 shadow-2xl min-h-[760px] relative overflow-hidden">
            <div className="absolute top-10 left-10 w-44 h-44 bg-emerald-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-52 h-52 bg-teal-400/20 rounded-full blur-3xl" />

            <div className="flex justify-center mt-4">
              <div className="w-36 h-36 xl:w-40 xl:h-40 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-200 animate-pulse">
                <Building2 size={70} className="text-white" />
              </div>
            </div>

            <div className="text-center mt-10">
              <h1 className="text-4xl xl:text-5xl font-extrabold text-emerald-950 leading-tight">
                Welcome Back to
                <span className="block text-emerald-600 mt-2">Zintellect AI</span>
              </h1>
              <p className="mt-8 text-slate-600 text-lg xl:text-xl leading-9">
                Access your provider dashboard and manage AI-powered healthcare prior authorization workflows securely.
              </p>
            </div>

            <div className="space-y-5 mt-14">
              <div className="flex items-center gap-5 bg-white/70 backdrop-blur-lg p-5 rounded-2xl shadow-md hover:scale-[1.02] transition-all duration-300">
                <div className="bg-emerald-100 p-3 rounded-xl">
                  <Sparkles className="text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-950">AI Decision Engine</h3>
                  <p className="text-slate-500 text-sm">Faster prior authorization approvals</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/70 backdrop-blur-lg p-5 rounded-2xl shadow-md hover:scale-[1.02] transition-all duration-300">
                <div className="bg-teal-100 p-3 rounded-xl">
                  <CheckCircle2 className="text-teal-700" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-950">Secure Access</h3>
                  <p className="text-slate-500 text-sm">Enterprise-grade healthcare security</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-white/70 backdrop-blur-lg p-5 rounded-2xl shadow-md hover:scale-[1.02] transition-all duration-300">
                <div className="bg-emerald-100 p-3 rounded-xl">
                  <Activity className="text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-950">Real-time Workflow</h3>
                  <p className="text-slate-500 text-sm">Monitor authorization requests instantly</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-emerald-100/40 shadow-2xl rounded-[35px] p-6 sm:p-8 md:p-12 lg:p-14 relative overflow-hidden">
            <div className="lg:hidden flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-2xl">
                <ShieldCheck size={45} className="text-white" />
              </div>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-emerald-950 leading-tight">
                Provider <span className="text-emerald-600">Login</span>
              </h1>
              <p className="text-slate-500 mt-4 text-sm sm:text-base md:text-lg leading-7 md:leading-8">
                Access healthcare policy management dashboard and AI-powered authorization services.
              </p>
            </div>

            <div className="mb-6">
              <label className="block font-bold text-emerald-950 mb-3 text-sm md:text-base">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-5 text-slate-400" size={22} />
                <input type="email" name="email" placeholder="Enter provider email"
                  value={formData.email} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm transition-all text-sm md:text-base text-slate-900" />
              </div>
            </div>

            <div className="mb-8">
              <label className="block font-bold text-emerald-950 mb-3 text-sm md:text-base">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-5 text-slate-400" size={22} />
                <input type="password" name="password" placeholder="Enter secure password"
                  value={formData.password} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl py-4 md:py-5 pl-14 pr-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm transition-all text-sm md:text-base text-slate-900" />
              </div>
            </div>

            <button onClick={handleLogin} disabled={loading}
              className={`w-full rounded-2xl py-4 md:py-5 text-base md:text-lg font-bold text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                loading ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-emerald-700 to-teal-600 hover:scale-[1.02] hover:shadow-2xl"
              }`}>
              {loading ? "Signing In..." : "Provider Login"}
              {!loading && <ArrowRight size={20} />}
            </button>

            <button onClick={() => navigate("/provider-register")}
              className="w-full mt-5 border border-emerald-200 bg-white hover:bg-emerald-50 rounded-2xl py-4 md:py-5 text-emerald-950 font-bold transition-all duration-300 text-sm md:text-base">
              Register New Provider
            </button>

            <div className="mt-8 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 md:p-5 flex items-start md:items-center gap-4">
              <ShieldCheck className="text-emerald-700 mt-1 md:mt-0" size={22} />
              <p className="text-slate-600 text-xs sm:text-sm leading-6">
                Your provider credentials are securely protected using enterprise healthcare authentication systems.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
