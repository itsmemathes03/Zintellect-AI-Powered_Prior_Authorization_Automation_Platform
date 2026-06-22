import { useState, useEffect } from "react"
import {
  BarChart3, TrendingUp, Brain, Download, Loader, Users, CheckCircle2, XCircle, Clock, Activity
} from "lucide-react"
import { getAdminAnalytics } from "../services/api"
import Papa from "papaparse"
import { useToast } from "../components/Toast"
import StatusPieChart from "../components/charts/StatusPieChart"
import RequestsLineChart from "../components/charts/RequestsLineChart"
import UserBarChart from "../components/charts/UserBarChart"
import PageTransition from "../components/PageTransition"

export default function SystemAnalytics() {
  const { addToast } = useToast()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAnalytics() }, [])

  const loadAnalytics = async () => {
    try {
      const res = await getAdminAnalytics()
      setAnalytics(res.data)
    } catch (err) {
      addToast("Failed to load analytics", "error")
    }
    setLoading(false)
  }

  const exportCSV = (data, filename) => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
    addToast("CSV exported successfully", "success")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="animate-spin mx-auto text-blue-600" size={40} />
          <p className="mt-4 text-slate-500 font-medium">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const overviewCards = [
    { label: "Total Requests", value: analytics?.total_requests || 0, icon: Activity, gradient: "from-blue-500 to-indigo-600" },
    { label: "Approved", value: analytics?.approved_requests || 0, icon: CheckCircle2, gradient: "from-emerald-500 to-green-600" },
    { label: "Rejected", value: analytics?.rejected_requests || 0, icon: XCircle, gradient: "from-red-500 to-rose-600" },
    { label: "Pending", value: analytics?.pending_requests || 0, icon: Clock, gradient: "from-amber-500 to-orange-600" },
    { label: "Manual Review", value: analytics?.manual_review_requests || 0, icon: Brain, gradient: "from-purple-500 to-violet-600" },
    { label: "Avg Confidence", value: `${analytics?.avg_confidence || 0}%`, icon: TrendingUp, gradient: "from-cyan-500 to-teal-600" },
    { label: "Total Users", value: analytics?.total_users || 0, icon: Users, gradient: "from-indigo-500 to-purple-600" },
    { label: "Pending Policies", value: analytics?.pending_policies || 0, icon: BarChart3, gradient: "from-amber-500 to-yellow-600" },
  ]

  return (
    <PageTransition>
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">System Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Detailed platform metrics and performance data</p>
        </div>
        <button
          onClick={() => {
            const data = [
              { metric: "Total Requests", value: analytics?.total_requests },
              { metric: "Approved", value: analytics?.approved_requests },
              { metric: "Rejected", value: analytics?.rejected_requests },
              { metric: "Pending", value: analytics?.pending_requests },
              { metric: "Manual Review", value: analytics?.manual_review_requests },
              { metric: "Avg AI Confidence", value: analytics?.avg_confidence },
              { metric: "Total Users", value: analytics?.total_users },
              { metric: "Doctors", value: analytics?.doctors },
              { metric: "Providers", value: analytics?.providers },
              { metric: "Patients", value: analytics?.patients },
              { metric: "Pending Policies", value: analytics?.pending_policies },
            ]
            exportCSV(data, "system-analytics.csv")
          }}
          className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-blue-100 dark:border-slate-700 px-5 py-2.5 rounded-2xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-blue-100 dark:border-slate-700 p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{card.label}</p>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{card.value}</p>
            </div>
          )
        })}
      </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-blue-100 dark:border-slate-700 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Users className="text-blue-600" size={24} />
              User Breakdown
            </h2>
            <button onClick={() => {
              const data = [
                { role: "Doctors", count: analytics?.doctors },
                { role: "Providers", count: analytics?.providers },
                { role: "Patients", count: analytics?.patients },
                { role: "Admins", count: analytics?.admins },
              ]
              exportCSV(data, "user-breakdown.csv")
            }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold">
              <Download size={14} /> Export
            </button>
          </div>
          <UserBarChart
            data={[
              { label: "Doctors", value: analytics?.doctors || 0 },
              { label: "Providers", value: analytics?.providers || 0 },
              { label: "Patients", value: analytics?.patients || 0 },
              { label: "Admins", value: analytics?.admins || 0 },
            ]}
            height={250}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-blue-100 dark:border-slate-700 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <BarChart3 className="text-blue-600" size={24} />
                Request Status Distribution
              </h2>
              <button onClick={() => {
                const data = analytics?.status_distribution || []
                exportCSV(data, "status-distribution.csv")
              }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold">
                <Download size={14} /> Export
              </button>
            </div>
            <StatusPieChart data={analytics?.status_distribution || []} height={320} />
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-blue-100 dark:border-slate-700 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <TrendingUp className="text-blue-600" size={24} />
                Requests Over Time
              </h2>
              <button onClick={() => {
                const data = analytics?.requests_over_time || []
                exportCSV(data, "requests-over-time.csv")
              }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold">
                <Download size={14} /> Export
              </button>
            </div>
            <RequestsLineChart data={analytics?.requests_over_time || []} height={320} />
          </div>
        </div>
    </div>
    </PageTransition>
  )
}
