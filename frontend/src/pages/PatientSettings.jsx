import { useState, useEffect } from "react"
import { Settings, UserRound, Mail, Phone, Shield, Save, AlertCircle, CheckCircle2 } from "lucide-react"

export default function PatientSettings() {
  const token = localStorage.getItem("access_token")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    patient_name: "", phone: "", address: "", date_of_birth: "", gender: "",
  })
  const [message, setMessage] = useState({ type: "", text: "" })

  useEffect(() => {
    fetchProfile()
  }, [])

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
    } catch (e) { console.log(e) }
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
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update profile" })
    }
    setSaving(false)
    setTimeout(() => setMessage({ type: "", text: "" }), 4000)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center shadow-inner">
          <Settings className="text-rose-700" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-rose-950">Profile Settings</h1>
          <p className="text-slate-500 text-sm">Manage your personal information</p>
        </div>
      </div>

      {message.text && (
        <div className={`rounded-2xl p-5 flex items-start gap-4 ${
          message.type === "success" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"
        }`}>
          {message.type === "success" ? (
            <CheckCircle2 className="text-emerald-600 mt-1" size={22} />
          ) : (
            <AlertCircle className="text-red-600 mt-1" size={22} />
          )}
          <p className={message.type === "success" ? "text-emerald-700 font-medium" : "text-red-700 font-medium"}>
            {message.text}
          </p>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-rose-100/50 p-8 lg:p-10">
        <h2 className="text-2xl font-bold text-rose-950 mb-8">Personal Information</h2>

        <div className="mb-6">
          <label className="block font-bold text-rose-950 mb-3 text-sm">Patient Name</label>
          <div className="relative">
            <UserRound className="absolute left-5 top-4 text-slate-400" size={20} />
            <input type="text" name="patient_name" value={formData.patient_name} onChange={handleChange}
              className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm text-slate-900" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block font-bold text-rose-950 mb-3 text-sm">Phone</label>
          <div className="relative">
            <Phone className="absolute left-5 top-4 text-slate-400" size={20} />
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
              className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm text-slate-900" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block font-bold text-rose-950 mb-3 text-sm">Address</label>
          <div className="relative">
            <Mail className="absolute left-5 top-4 text-slate-400" size={20} />
            <input type="text" name="address" value={formData.address} onChange={handleChange}
              className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm text-slate-900" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block font-bold text-rose-950 mb-3 text-sm">Date of Birth</label>
            <div className="relative">
              <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange}
                className="w-full border border-slate-200 rounded-2xl py-4 px-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm text-slate-900" />
            </div>
          </div>
          <div>
            <label className="block font-bold text-rose-950 mb-3 text-sm">Gender</label>
            <div className="relative">
              <select name="gender" value={formData.gender} onChange={handleChange}
                className="w-full border border-slate-200 rounded-2xl py-4 px-5 bg-white/70 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm text-slate-900">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className={`w-full sm:w-auto rounded-2xl py-4 px-10 font-bold text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
            saving ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-rose-700 to-pink-600 hover:scale-[1.02] hover:shadow-2xl"
          }`}>
          <Save size={20} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-rose-100/50 p-8 lg:p-10">
        <h2 className="text-2xl font-bold text-rose-950 mb-8">Insurance Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-rose-50 rounded-2xl p-5">
            <p className="text-sm text-rose-600 font-semibold">Insurance Provider</p>
            <p className="text-rose-950 font-bold text-lg mt-2">{localStorage.getItem("insurance_provider") || "N/A"}</p>
          </div>
          <div className="bg-rose-50 rounded-2xl p-5">
            <p className="text-sm text-rose-600 font-semibold">Policy Number</p>
            <p className="text-rose-950 font-bold text-lg mt-2 font-mono">{localStorage.getItem("policy_number") || "N/A"}</p>
          </div>
          <div className="bg-rose-50 rounded-2xl p-5">
            <p className="text-sm text-rose-600 font-semibold">Insurance ID</p>
            <p className="text-rose-950 font-bold text-lg mt-2 font-mono">{localStorage.getItem("insurance_id") || "N/A"}</p>
          </div>
          <div className="bg-rose-50 rounded-2xl p-5">
            <p className="text-sm text-rose-600 font-semibold">Coverage Status</p>
            <p className="text-emerald-600 font-bold text-lg mt-2">{localStorage.getItem("coverage_status") || "Active"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
