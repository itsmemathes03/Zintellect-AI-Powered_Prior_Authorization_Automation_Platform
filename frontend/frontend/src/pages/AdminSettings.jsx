import { useState, useEffect } from "react"
import { Settings, Save, Clock, AlertTriangle, Shield, Loader2 } from "lucide-react"
import { getAdminSettings, updateAdminSettings } from "../services/api"
import { useToast } from "../components/Toast"
import PageHeader from "../components/ui/PageHeader"
import Card, { CardHeader, CardTitle } from "../components/ui/Card"
import Button from "../components/ui/Button"

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-brand-600 dark:text-brand-400" size={40} />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading settings...</p>
      </div>
    )
  }

  const slaLevels = [
    {
      key: "routine_hours", label: "Routine",
      description: "Standard processing time for non-urgent requests",
      dot: "bg-success-500", inputFocus: "focus:ring-success-500", accent: "text-success-600 dark:text-success-500",
    },
    {
      key: "urgent_hours", label: "Urgent",
      description: "Accelerated processing for time-sensitive requests",
      dot: "bg-warning-500", inputFocus: "focus:ring-warning-500", accent: "text-warning-600 dark:text-warning-500",
    },
    {
      key: "critical_hours", label: "Critical",
      description: "Immediate processing for emergency requests",
      dot: "bg-danger-500", inputFocus: "focus:ring-danger-500", accent: "text-danger-600 dark:text-danger-500",
    },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="System Settings"
        description="Configure SLA thresholds and system parameters"
        icon={Settings}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center ring-1 ring-brand-600/10">
              <Clock size={22} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <CardTitle>SLA Duration Settings</CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Set maximum processing hours per urgency level</p>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-6">
          {slaLevels.map((level) => (
            <div key={level.key} className="bg-slate-50 dark:bg-navy-800/50 border border-slate-100 dark:border-navy-700 rounded-xl p-6 hover:shadow-card transition-shadow">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${level.dot}`} />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{level.label}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{level.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={1} max={168}
                    value={settings[level.key]}
                    onChange={(e) => setSettings({ ...settings, [level.key]: Math.max(1, Math.min(168, parseInt(e.target.value) || 0)) })}
                    className="w-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">hours</span>
                </div>
              </div>
              <input
                type="range" min={1} max={168}
                value={settings[level.key]}
                onChange={(e) => setSettings({ ...settings, [level.key]: parseInt(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none bg-slate-200 dark:bg-navy-700 accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1 hour</span>
                <span>168 hours (7 days)</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800/40 rounded-xl">
          <div className="flex items-start gap-3">
            <Shield className="text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">SLA Configuration Summary</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Routine: <strong className={slaLevels[0].accent}>{settings.routine_hours}h</strong> |
                Urgent: <strong className={slaLevels[1].accent}>{settings.urgent_hours}h</strong> |
                Critical: <strong className={slaLevels[2].accent}>{settings.critical_hours}h</strong>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                These values will be used by SLATimer components across the platform.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={saving} loading={saving}>
            {!saving && <Save size={16} />}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </Card>
    </div>
  )
}