import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, FileText, CheckCircle2, Clock, AlertTriangle, Activity, TrendingUp, Brain, Sparkles, ArrowRight, ClipboardList, ShieldCheck, BarChart3 } from "lucide-react"
import StatusPieChart from "../components/charts/StatusPieChart"
import { getProviderStats, getProviderRequests } from "../services/api"

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const providerName = localStorage.getItem("provider_name") || "Provider"
  const [stats, setStats] = useState(null)
  const [recentRequests, setRecentRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, requestsRes] = await Promise.all([
          getProviderStats(),
          getProviderRequests({ page_size: 5 }),
        ])
        const statsData = statsRes.data
        const requestsData = requestsRes.data
        setStats(statsData)
        setRecentRequests(requestsData.items || [])
      } catch (e) { console.log(e) }
      setLoading(false)
    }
    loadData()
  }, [])

  const getStatusBadge = (status) => {
    const map = {
      Approved: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
      Rejected: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
      Pending: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
      "Manual Review": "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    }
    return map[status] || "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-emerald-950 dark:text-emerald-100 text-xl font-bold">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 px-4 py-2 rounded-full mb-4">
            <Sparkles size={16} className="text-emerald-600 dark:text-emerald-300" />
            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Provider Dashboard</span>
          </div>
          <h1 className="text-4xl font-extrabold text-emerald-950 dark:text-white">Welcome, {providerName}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Manage authorization requests and insurance policies.</p>
        </div>
        <button
          onClick={() => navigate("/provider-dashboard/requests")}
          className="hidden sm:flex items-center gap-3 bg-gradient-to-r from-emerald-700 to-teal-600 text-white px-6 py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl"
        >
          <ClipboardList size={20} />
          View All Requests
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100/50 dark:border-slate-700 p-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Total Requests</p>
              <h2 className="text-5xl font-extrabold text-emerald-950 dark:text-white mt-3">{stats?.total_requests || 0}</h2>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/60 dark:to-teal-900/60 flex items-center justify-center shadow-inner">
              <FileText className="text-emerald-600 dark:text-emerald-300" size={32} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Activity size={16} className="text-emerald-500" />
            All time submissions
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100/50 dark:border-slate-700 p-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Approved</p>
              <h2 className="text-5xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-3">{stats?.approved || 0}</h2>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/60 dark:to-green-900/60 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-300" size={32} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <TrendingUp size={16} className="text-emerald-500" />
            Approved requests
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100/50 dark:border-slate-700 p-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Pending</p>
              <h2 className="text-5xl font-extrabold text-yellow-600 dark:text-yellow-400 mt-3">{stats?.pending || 0}</h2>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/60 dark:to-amber-900/60 flex items-center justify-center shadow-inner">
              <Clock className="text-yellow-600 dark:text-yellow-300" size={32} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <AlertTriangle size={16} className="text-yellow-500" />
            Awaiting decision
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100/50 dark:border-slate-700 p-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Policies</p>
              <h2 className="text-5xl font-extrabold text-emerald-950 dark:text-white mt-3">{stats?.total_policies || 0}</h2>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/60 dark:to-teal-900/60 flex items-center justify-center shadow-inner">
              <ShieldCheck className="text-emerald-600 dark:text-emerald-300" size={32} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Building2 size={16} className="text-emerald-500" />
            Active policies
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100/50 dark:border-slate-700 p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/60 dark:to-teal-900/60 flex items-center justify-center shadow-inner">
              <BarChart3 className="text-emerald-700 dark:text-emerald-300" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emerald-950 dark:text-white">Request Status</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Approval breakdown</p>
            </div>
          </div>
          <StatusPieChart
            data={[
              { status: "Approved", count: stats?.approved || 0 },
              { status: "Pending", count: stats?.pending || 0 },
              { status: "Rejected", count: stats?.rejected || 0 },
            ].filter((d) => d.count > 0)}
            height={260}
          />
        </div>

        <div className="xl:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100/50 dark:border-slate-700 p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/60 dark:to-teal-900/60 flex items-center justify-center shadow-inner">
              <Brain className="text-emerald-700 dark:text-emerald-300" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emerald-950 dark:text-white">Recent Requests</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Latest prior authorization submissions</p>
            </div>
          </div>

          {recentRequests.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/80 rounded-3xl border border-slate-200">
              <FileText className="mx-auto text-slate-300" size={48} />
              <h3 className="text-xl font-bold text-emerald-950 mt-6">No Requests Yet</h3>
              <p className="text-slate-500 mt-3">Authorization requests from doctors will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRequests.map((req) => (
                <div key={req.id} className="border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all hover:border-emerald-200 hover:scale-[1.01]">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{req.patient_name}</h3>
                      <p className="text-slate-600 text-sm mt-1">{req.procedure_code} - {req.diagnosis?.substring(0, 60)}</p>
                      <p className="text-xs text-slate-400 mt-2 font-mono">{req.id?.substring(0, 8)}...</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`border px-3 py-1.5 rounded-full text-xs font-bold ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-800 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-6">
              <Sparkles className="text-emerald-300" size={28} />
            </div>
            <h2 className="text-3xl font-bold">AI-Powered Reviews</h2>
            <p className="text-emerald-100 mt-4 leading-8 text-lg">
              Zintellect AI analyzes prior authorization requests against your insurance policies and delivers intelligent decisions in seconds.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <Brain className="text-emerald-300" size={24} />
                <div>
                  <h3 className="font-bold">96% Accuracy</h3>
                  <p className="text-emerald-100 text-sm">AI policy matching engine</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <TrendingUp className="text-emerald-300" size={24} />
                <div>
                  <h3 className="font-bold">Real-Time Processing</h3>
                  <p className="text-emerald-100 text-sm">Average 2.1 seconds per request</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/provider-dashboard/requests")}
              className="mt-8 w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl py-4 font-bold text-white hover:bg-white/20 transition-all flex items-center justify-center gap-3"
            >
              Go to Request Center <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
