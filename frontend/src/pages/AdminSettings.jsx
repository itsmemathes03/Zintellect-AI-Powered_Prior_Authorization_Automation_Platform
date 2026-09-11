import { useState, useEffect } from "react"
import { Settings, Save, Clock, AlertTriangle, Loader, Shield } from "lucide-react"
import { getAdminSettings, updateAdminSettings } from "../services/api"
import { useToast } from "../components/Toast"

export default function AdminSettings() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    routine_hours: 48,
    urgent_hours: 24,
    critical_hours: 12,
  })

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    try {
      const res = await getAdminSettings()
      setSettings(res.data.settings)
    } catch (err) {
      addToast("Failed to load settings", "error")
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateAdminSettings(settings)
      addToast("Settings saved successfully. SLA timers will use the new values.", "success")
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to save settings", "error")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="animate-spin mx-auto text-blue-600" size={40} />
          <p className="mt-4 text-slate-500 font-medium">Loading settings...</p>
        </div>
      </div>
    )
  }

  const slaLevels = [
    {
      key: "routine_hours", label: "Routine",
      description: "Standard processing time for non-urgent requests",
      color: "from-blue-500 to-indigo-600", iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      key: "urgent_hours", label: "Urgent",
      description: "Accelerated processing for time-sensitive requests",
      color: "from-amber-500 to-orange-600", iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      key: "critical_hours", label: "Critical",
      description: "Immediate processing for emergency requests",
      color: "from-red-500 to-rose-600", iconColor: "text-red-600 dark:text-red-400",
    },
  ]

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Configure SLA thresholds and system parameters</p>
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-blue-100 dark:border-slate-700 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
            <Clock className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">SLA Duration Settings</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Set maximum processing hours per urgency level</p>
          </div>
        </div>

        <div className="space-y-6">
          {slaLevels.map((level) => (
            <div key={level.key} className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-slate-700 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${level.color}`} />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{level.label}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{level.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={1} max={168}
                    value={settings[level.key]}
                    onChange={(e) => setSettings({ ...settings, [level.key]: Math.max(1, Math.min(168, parseInt(e.target.value) || 0)) })}
                    className="w-20 px-3 py-2 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">hours</span>
                </div>
              </div>
              <input
                type="range" min={1} max={168}
                value={settings[level.key]}
                onChange={(e) => setSettings({ ...settings, [level.key]: parseInt(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none bg-slate-200 dark:bg-slate-700 accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1 hour</span>
                <span>168 hours (7 days)</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">SLA Configuration Summary</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Routine: <strong className="text-blue-600 dark:text-blue-400">{settings.routine_hours}h</strong> |
                Urgent: <strong className="text-amber-600 dark:text-amber-400">{settings.urgent_hours}h</strong> |
                Critical: <strong className="text-red-600 dark:text-red-400">{settings.critical_hours}h</strong>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                These values will be used by SLATimer components across the platform.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 hover:shadow-lg hover:shadow-blue-200 dark:hover:shadow-blue-900/30 transition-all shadow-md disabled:opacity-50"
          >
            {saving ? (
              <Loader className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  )
}
