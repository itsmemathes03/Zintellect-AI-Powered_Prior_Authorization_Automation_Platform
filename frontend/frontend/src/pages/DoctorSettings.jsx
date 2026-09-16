import { useState, useEffect } from "react"
import { Settings, UserRound, Mail, Building2, Microscope, IdCard, Phone, Save, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "../components/Toast"
import PageHeader from "../components/ui/PageHeader"
import Card, { CardHeader, CardTitle } from "../components/ui/Card"
import Button from "../components/ui/Button"
import { SkeletonCard } from "../components/ui/Skeleton"

export default function DoctorSettings() {
  const token = localStorage.getItem("access_token")
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", phone: "",
    hospital_name: "", specialization: "", license_number: "",
  })
  const [message, setMessage] = useState({ type: "", text: "" })

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/doctor/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.phone || "",
        hospital_name: data.hospital_name || "",
        specialization: data.specialization || "",
        license_number: data.license_number || "",
      })
    } catch (e) { console.log(e); addToast("Failed to load profile", "error") }
    setLoading(false)
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: "", text: "" })
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/doctor/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.status === "Success") {
        setMessage({ type: "success", text: "Profile updated successfully" })
        if (formData.first_name || formData.last_name) {
          localStorage.setItem("doctor_name", `${formData.first_name} ${formData.last_name}`.trim())
        }
      } else {
        setMessage({ type: "error", text: data.detail || "Failed to update profile" })
        addToast(data.detail || "Failed to update profile", "error")
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update profile" })
      addToast("Failed to update profile", "error")
    }
    setSaving(false)
    setTimeout(() => setMessage({ type: "", text: "" }), 4000)
  }

  if (loading) {
    return <SkeletonCard />
  }

  const doctorEmail = localStorage.getItem("doctor_email") || "..."

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Profile Settings"
        description="Manage your professional profile information"
        icon={Settings}
      />

      {message.text && (
        <div className={`rounded-xl p-4 flex items-start gap-3 animate-fade-in ${
          message.type === "success"
            ? "bg-success-50 dark:bg-success-500/10 border border-success-500/20"
            : "bg-danger-50 dark:bg-danger-500/10 border border-danger-500/20"
        }`}>
          {message.type === "success"
            ? <CheckCircle2 size={20} className="text-success-600 mt-0.5 shrink-0" />
            : <AlertCircle size={20} className="text-danger-600 mt-0.5 shrink-0" />}
          <p className={message.type === "success" ? "text-success-700 dark:text-success-400 font-medium" : "text-danger-700 dark:text-danger-500 font-medium"}>
            {message.text}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound size={18} className="text-teal-600" /> Personal Information
          </CardTitle>
        </CardHeader>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">First Name</label>
              <div className="relative">
                <UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="input-field pl-9" />
              </div>
            </div>
            <div>
              <label className="label">Last Name</label>
              <div className="relative">
                <UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="input-field pl-9" />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" value={doctorEmail} disabled className="input-field pl-9 bg-slate-100 dark:bg-navy-800 text-slate-500 cursor-not-allowed" />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Email cannot be changed</p>
          </div>

          <div>
            <label className="label">Phone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field pl-9" />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Microscope size={18} className="text-teal-600" /> Professional Information
          </CardTitle>
        </CardHeader>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Hospital</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" name="hospital_name" value={formData.hospital_name} onChange={handleChange} className="input-field pl-9" />
              </div>
            </div>
            <div>
              <label className="label">Specialization</label>
              <div className="relative">
                <Microscope size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} className="input-field pl-9" />
              </div>
            </div>
          </div>

          <div>
            <label className="label">License Number</label>
            <div className="relative">
              <IdCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} className="input-field pl-9" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button onClick={handleSave} disabled={saving} loading={saving}>
              <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}