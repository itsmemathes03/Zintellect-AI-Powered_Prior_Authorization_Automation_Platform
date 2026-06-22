import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  FileText, Users, Shield, Clock, TrendingUp, Brain, Activity, AlertTriangle,
  CheckCircle2, Zap, BarChart3, UserCheck, Loader, ArrowRight
} from "lucide-react"
import { getAdminAnalytics } from "../services/api"
import ParticleBackground from "../components/ParticleBackground"
import StatusPieChart from "../components/charts/StatusPieChart"
import RequestsLineChart from "../components/charts/RequestsLineChart"

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    const adminId = localStorage.getItem("admin_id") || localStorage.getItem("access_token")
    if (!adminId) { navigate("/admin-login"); return }
    loadAnalytics()
  }, [navigate])

  const loadAnalytics = async () => {
    try {
      const res = await getAdminAnalytics()
      setAnalytics(res.data)
      setRecentActivity(res.data.recent_activity || [])
    } catch (err) {
      console.error("Failed to load analytics", err)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse" />
          <Loader className="animate-spin mx-auto text-blue-600 relative" size={48} />
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = [
    { label: "Total Requests", value: analytics?.total_requests || 0, icon: FileText, color: "from-blue-500 to-indigo-500", bg: "bg-blue-50 dark:bg-blue-900/20", trend: `${analytics?.approved_requests || 0} approved` },
    { label: "Active Users", value: analytics?.total_users || 0, icon: Users, color: "from-indigo-500 to-purple-500", bg: "bg-indigo-50 dark:bg-indigo-900/20", trend: `${analytics?.doctors || 0} doctors, ${analytics?.providers || 0} providers` },
    { label: "Pending Policies", value: analytics?.pending_policies || 0, icon: Shield, color: "from-amber-500 to-orange-500", bg: "bg-amber-50 dark:bg-amber-900/20", trend: "Awaiting approval" },
    { label: "Avg AI Confidence", value: `${analytics?.avg_confidence || 0}%`, icon: Brain, color: "from-cyan-500 to-teal-500", bg: "bg-cyan-50 dark:bg-cyan-900/20", trend: "System wide" },
    { label: "Approved", value: analytics?.approved_requests || 0, icon: CheckCircle2, color: "from-emerald-500 to-green-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", trend: `${((analytics?.approved_requests / Math.max(analytics?.total_requests, 1)) * 100).toFixed(1)}% rate` },
    { label: "Rejected", value: analytics?.rejected_requests || 0, icon: AlertTriangle, color: "from-red-500 to-rose-500", bg: "bg-red-50 dark:bg-red-900/20", trend: `${((analytics?.rejected_requests / Math.max(analytics?.total_requests, 1)) * 100).toFixed(1)}% rate` },
  ]

  return (
    <div className="space-y-8 relative">
      <div className="relative">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4 relative">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Monitor platform operations and key metrics</p>
        </div>
        <div className="flex items-center gap-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl px-5 py-2.5 border border-blue-100 dark:border-slate-700 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">System Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-blue-100 dark:border-slate-700 p-6 hover:shadow-2xl hover:shadow-blue-200/50 dark:hover:shadow-blue-900/20 hover:scale-[1.02] transition-all duration-300"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">{stat.label}</p>
                  <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2">{stat.value}</h2>
                </div>
                <div className={`w-16 h-16 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon size={32} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${stat.color}`} />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.trend}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-blue-100 dark:border-slate-700 p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={24} />
            Request Status
          </h2>
          <StatusPieChart data={analytics?.status_distribution || []} height={280} />
        </div>

        <div className="xl:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-blue-100 dark:border-slate-700 p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <TrendingUp className="text-blue-600" size={24} />
            Requests Over Time
          </h2>
          <RequestsLineChart data={analytics?.requests_over_time || []} height={280} />
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-blue-100 dark:border-slate-700 p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <Activity className="text-blue-600" size={24} />
            Recent Activity
          </h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-blue-50 dark:border-slate-700 last:border-0 group hover:bg-blue-50/50 dark:hover:bg-slate-700/30 -mx-2 px-2 rounded-xl transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activity.action?.includes("CREATED") ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                    activity.action?.includes("APPROVED") ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                    activity.action?.includes("REJECTED") ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                    "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}>
                    <Activity size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{activity.description || activity.action}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button onClick={() => navigate("/admin-dashboard/users")}
          className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-blue-100 dark:border-slate-700 p-6 hover:shadow-2xl hover:shadow-blue-200/50 dark:hover:shadow-blue-900/20 hover:scale-[1.02] transition-all duration-300 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 group-hover:scale-110 transition-transform">
            <Users className="text-white" size={28} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Manage Users</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">View, create, and manage platform users</p>
          <div className="flex items-center gap-1 mt-4 text-blue-600 dark:text-blue-400 text-sm font-semibold group-hover:gap-2 transition-all">
            Go to Users <ArrowRight size={16} />
          </div>
        </button>
        <button onClick={() => navigate("/admin-dashboard/policies")}
          className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-blue-100 dark:border-slate-700 p-6 hover:shadow-2xl hover:shadow-blue-200/50 dark:hover:shadow-blue-900/20 hover:scale-[1.02] transition-all duration-300 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 group-hover:scale-110 transition-transform">
            <Shield className="text-white" size={28} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Review Policies</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{analytics?.pending_policies || 0} policies awaiting approval</p>
          <div className="flex items-center gap-1 mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-semibold group-hover:gap-2 transition-all">
            Go to Policies <ArrowRight size={16} />
          </div>
        </button>
        <button onClick={() => navigate("/admin-dashboard/analytics")}
          className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-blue-100 dark:border-slate-700 p-6 hover:shadow-2xl hover:shadow-blue-200/50 dark:hover:shadow-blue-900/20 hover:scale-[1.02] transition-all duration-300 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-bl-full" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-200 dark:shadow-cyan-900/30 group-hover:scale-110 transition-transform">
            <BarChart3 className="text-white" size={28} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">View Analytics</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Detailed system performance metrics</p>
          <div className="flex items-center gap-1 mt-4 text-cyan-600 dark:text-cyan-400 text-sm font-semibold group-hover:gap-2 transition-all">
            Go to Analytics <ArrowRight size={16} />
          </div>
        </button>
      </div>
    </div>
  )
}
