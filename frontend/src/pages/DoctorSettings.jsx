import { useState, useEffect } from "react"
import { Settings, UserRound, Mail, Building2, Microscope, IdCard, Phone, Save, AlertCircle, CheckCircle2 } from "lucide-react"

export default function DoctorSettings() {
  const token = localStorage.getItem("access_token")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", phone: "",
    hospital_name: "", specialization: "", license_number: "",
  })
  const [message, setMessage] = useState({ type: "", text: "" })

  useEffect(() => {
    fetchProfile()
  }, [])

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
    } catch (e) { console.log(e) }
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
        <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-100 to-sky-100 flex items-center justify-center shadow-inner">
          <Settings className="text-cyan-700" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-cyan-950">Profile Settings</h1>
          <p className="text-slate-500 text-sm">Manage your professional profile information</p>
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

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-cyan-100/50 p-8 lg:p-10">
        <h2 className="text-2xl font-bold text-cyan-950 mb-8">Personal Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block font-bold text-cyan-950 mb-3 text-sm">First Name</label>
            <div className="relative">
              <UserRound className="absolute left-5 top-4 text-slate-400" size={20} />
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange}
                className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm text-slate-900" />
            </div>
          </div>
          <div>
            <label className="block font-bold text-cyan-950 mb-3 text-sm">Last Name</label>
            <div className="relative">
              <UserRound className="absolute left-5 top-4 text-slate-400" size={20} />
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange}
                className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm text-slate-900" />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block font-bold text-cyan-950 mb-3 text-sm">Phone</label>
          <div className="relative">
            <Phone className="absolute left-5 top-4 text-slate-400" size={20} />
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
              className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm text-slate-900" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-cyan-950 mb-8 mt-10">Professional Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block font-bold text-cyan-950 mb-3 text-sm">Hospital</label>
            <div className="relative">
              <Building2 className="absolute left-5 top-4 text-slate-400" size={20} />
              <input type="text" name="hospital_name" value={formData.hospital_name} onChange={handleChange}
                className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm text-slate-900" />
            </div>
          </div>
          <div>
            <label className="block font-bold text-cyan-950 mb-3 text-sm">Specialization</label>
            <div className="relative">
              <Microscope className="absolute left-5 top-4 text-slate-400" size={20} />
              <input type="text" name="specialization" value={formData.specialization} onChange={handleChange}
                className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm text-slate-900" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <label className="block font-bold text-cyan-950 mb-3 text-sm">License Number</label>
          <div className="relative">
            <IdCard className="absolute left-5 top-4 text-slate-400" size={20} />
            <input type="text" name="license_number" value={formData.license_number} onChange={handleChange}
              className="w-full border border-slate-200 rounded-2xl py-4 pl-12 pr-4 bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm text-slate-900" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className={`w-full sm:w-auto rounded-2xl py-4 px-10 font-bold text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
            saving ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-cyan-700 to-sky-600 hover:scale-[1.02] hover:shadow-2xl"
          }`}>
          <Save size={20} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  )
}
