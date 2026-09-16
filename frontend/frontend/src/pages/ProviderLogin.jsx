import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, Building2, ShieldCheck } from "lucide-react"
import AuthLayout from "../components/ui/AuthLayout"
import Button from "../components/ui/Button"
import { toast, friendlyMessage } from "../services/toast"

export default function ProviderLogin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      toast.warning("Please fill all fields");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.warning("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/provider/login`, {
        email: formData.email, password: formData.password,
      });
      if (response.data.status === "Success") {
        localStorage.setItem("provider_id", response.data.provider_id);
        localStorage.setItem("provider_name", response.data.provider_name);
        localStorage.setItem("access_token", response.data.access_token);
        navigate("/provider-dashboard");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(friendlyMessage(error));
    }
    setLoading(false);
  }

  return (
    <AuthLayout
      title="Provider Login"
      subtitle="Manage policies and AI-powered authorization workflows"
      icon={Building2}
      accentText="text-emerald-700 dark:text-emerald-400"
      features={[
        { title: "AI Decision Engine", description: "Accelerate prior authorization reviews" },
        { title: "Policy Management", description: "Upload and define authorization rules" },
        { title: "Real-time Workflow", description: "Monitor and review submitted requests" },
      ]}
    >
      <div className="space-y-5">
        <div>
          <label className="label" htmlFor="provider-email">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="provider-email"
              type="email"
              name="email"
              placeholder="Enter provider email"
              value={formData.email}
              onChange={handleChange}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="provider-password">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="provider-password"
              type="password"
              name="password"
              placeholder="Enter secure password"
              value={formData.password}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="input-field pl-10"
            />
          </div>
        </div>

        <Button variant="primary" size="lg" className="w-full" onClick={handleLogin} loading={loading}>
          {!loading && "Provider Login"}
        </Button>

        <button onClick={() => navigate("/provider-register")}
          className="w-full border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-navy-800/70 rounded-lg py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors">
          Register New Provider
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-5 border-t border-slate-100 dark:border-navy-800">
        <ShieldCheck size={12} />
        Enterprise-grade healthcare authentication.
      </div>
    </AuthLayout>
  )
}