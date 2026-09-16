import { useState, useEffect } from "react"
import { Settings, UserRound, MapPin, Phone, Save, AlertCircle, CheckCircle2, ShieldCheck, Hash, IdCard } from "lucide-react"
import { useToast } from "../components/Toast"
import PageHeader from "../components/ui/PageHeader"
import Card, { CardHeader, CardTitle } from "../components/ui/Card"
import Badge from "../components/ui/Badge"
import Button from "../components/ui/Button"
import { SkeletonCard } from "../components/ui/Skeleton"

export default function PatientSettings() {
  const token = localStorage.getItem("access_token")
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    patient_name: "", phone: "", address: "", date_of_birth: "", gender: "",
  })
  const [message, setMessage] = useState({ type: "", text: "" })

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/patient/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setFormData({
        patient_name: data.patient_name || "",
        phone: data.phone || "",
        address: data.address || "",
        date_of_birth: data.date_of_birth || "",
        gender: data.gender || "",
      })
    } catch (e) { console.log(e); addToast("Failed to load profile", "error") }
    setLoading(false)
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: "", text: "" })
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/patient/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.status === "Success") {
        setMessage({ type: "success", text: "Profile updated successfully" })
        if (formData.patient_name) {
          localStorage.setItem("patient_name", formData.patient_name)
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

  const insurance = {
    provider: localStorage.getItem("insurance_provider") || "N/A",
    policy_number: localStorage.getItem("policy_number") || "N/A",
    insurance_id: localStorage.getItem("insurance_id") || "N/A",
    coverage_status: localStorage.getItem("coverage_status") || "N/A",
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Profile Settings"
        description="Manage your personal information"
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
          <div>
            <label className="label">Patient Name</label>
            <div className="relative">
              <UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" name="patient_name" value={formData.patient_name} onChange={handleChange} className="input-field pl-9" />
            </div>
          </div>

          <div>
            <label className="label">Phone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field pl-9" />
            </div>
          </div>

          <div>
            <label className="label">Address</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" name="address" value={formData.address} onChange={handleChange} className="input-field pl-9" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button onClick={handleSave} disabled={saving} loading={saving}>
              <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-teal-600" /> Insurance Details
          </CardTitle>
        </CardHeader>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
            <p className="text-sm text-brand-700 dark:text-brand-400 font-semibold flex items-center gap-1.5"><ShieldCheck size={14} /> Insurance Provider</p>
            <p className="text-slate-900 dark:text-white font-bold text-lg mt-2">{insurance.provider}</p>
          </div>
          <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
            <p className="text-sm text-brand-700 dark:text-brand-400 font-semibold flex items-center gap-1.5"><Hash size={14} /> Policy Number</p>
            <p className="text-slate-900 dark:text-white font-bold text-lg mt-2 font-mono">{insurance.policy_number}</p>
          </div>
          <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
            <p className="text-sm text-brand-700 dark:text-brand-400 font-semibold flex items-center gap-1.5"><IdCard size={14} /> Insurance ID</p>
            <p className="text-slate-900 dark:text-white font-bold text-lg mt-2 font-mono">{insurance.insurance_id}</p>
          </div>
          <div className="bg-slate-50 dark:bg-navy-800/50 rounded-xl p-4 border border-slate-100 dark:border-navy-700">
            <p className="text-sm text-brand-700 dark:text-brand-400 font-semibold">Coverage Status</p>
            <p className="mt-2"><Badge color="green">{insurance.coverage_status}</Badge></p>
          </div>
        </div>
      </Card>
    </div>
  )
}