import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Stethoscope, Mail, Key, UserRound, Building2, Microscope, IdCard, AlertCircle, Shield, BadgeCheck, Phone } from "lucide-react"
import AuthLayout from "../components/ui/AuthLayout"
import Button from "../components/ui/Button"

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
    <AuthLayout
      title="Doctor Registration"
      subtitle="Create your account to manage prior authorization requests"
      icon={Stethoscope}
      accentText="text-teal-700 dark:text-teal-400"
      width="lg"
      features={[
        { title: "AI-Powered Workflows", description: "Intelligent prior authorization engine" },
        { title: "Enterprise Security", description: "HIPAA-aware healthcare compliance" },
        { title: "Real-Time Tracking", description: "Monitor authorization status 24/7" },
      ]}
    >
      <div className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-800 rounded-lg p-3">
            <AlertCircle size={16} className="text-danger-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2.5 bg-success-50 dark:bg-success-500/10 border border-success-500/20 rounded-lg p-3">
            <BadgeCheck size={16} className="text-success-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-success-700 dark:text-success-500">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="first_name">First Name</label>
            <div className="relative">
              <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="first_name" type="text" name="first_name" placeholder="First name"
                value={formData.first_name} onChange={handleChange} className="input-field pl-10" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="last_name">Last Name</label>
            <div className="relative">
              <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="last_name" type="text" name="last_name" placeholder="Last name"
                value={formData.last_name} onChange={handleChange} className="input-field pl-10" />
            </div>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="reg-email">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="reg-email" type="email" name="email" placeholder="doctor@zintellect.ai"
              value={formData.email} onChange={handleChange} className="input-field pl-10" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="reg-password">Password</label>
          <div className="relative">
            <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="reg-password" type="password" name="password" placeholder="Min. 6 characters"
              value={formData.password} onChange={handleChange} className="input-field pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="hospital_name">Hospital</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="hospital_name" type="text" name="hospital_name" placeholder="Hospital name"
                value={formData.hospital_name} onChange={handleChange} className="input-field pl-10" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="specialization">Specialization</label>
            <div className="relative">
              <Microscope size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="specialization" type="text" name="specialization" placeholder="e.g. Cardiology"
                value={formData.specialization} onChange={handleChange} className="input-field pl-10" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="license_number">License Number</label>
            <div className="relative">
              <IdCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="license_number" type="text" name="license_number" placeholder="Medical license"
                value={formData.license_number} onChange={handleChange} className="input-field pl-10" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="reg-phone">Phone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="reg-phone" type="tel" name="phone" placeholder="Phone number"
                value={formData.phone} onChange={handleChange} className="input-field pl-10" />
            </div>
          </div>
        </div>

        <Button variant="primary" size="lg" className="w-full" onClick={handleRegister} loading={loading}>
          {!loading && "Register as Doctor"}
        </Button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <button onClick={() => navigate("/doctor-login")} className="font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">
            Sign in
          </button>
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-5 border-t border-slate-100 dark:border-navy-800">
        <Shield size={12} />
        Your credentials are securely encrypted. All access is logged for compliance.
      </div>
    </AuthLayout>
  )
}