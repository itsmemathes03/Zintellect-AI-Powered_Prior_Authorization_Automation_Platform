import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FileText, Users, Shield, Brain, CheckCircle2, AlertTriangle, Activity, ArrowRight } from "lucide-react"
import { getAdminAnalytics } from "../services/api"
import PageHeader from "../components/ui/PageHeader"
import StatCard from "../components/ui/StatCard"
import Card, { CardHeader, CardTitle } from "../components/ui/Card"
import StatusBadge from "../components/ui/StatusBadge"
import EmptyState, { ErrorState } from "../components/ui/EmptyState"
import { SkeletonDashboard } from "../components/ui/Skeleton"
import StatusPieChart from "../components/charts/StatusPieChart"
import RequestsLineChart from "../components/charts/RequestsLineChart"

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    const adminId = localStorage.getItem("admin_id") || localStorage.getItem("access_token")
    if (!adminId) { navigate("/admin-login"); return }
    loadAnalytics()
  }, [navigate])

  const loadAnalytics = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await getAdminAnalytics()
      setAnalytics(res.data)
      setRecentActivity(res.data.recent_activity || [])
    } catch (err) {
      setError("Failed to load dashboard analytics. Please try again.")
    }
    setLoading(false)
  }

  if (loading) {
    return <SkeletonDashboard />
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load dashboard"
        description={error}
        onRetry={loadAnalytics}
      />
    )
  }

  const totalRequests = analytics?.total_requests || 0
  const approved = analytics?.approved_requests || 0
  const rejected = analytics?.rejected_requests || 0
  const approvalRate = totalRequests > 0 ? ((approved / totalRequests) * 100).toFixed(1) : "0.0"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Monitor platform operations and authorization activity"
        icon={Activity}
        actions={[
          <span key="status" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-success-500" />
            System Online
          </span>,
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={totalRequests}
          icon={FileText}
          color="brand"
          trendLabel={`${approved} approved`}
          trend="neutral"
        />
        <StatCard
          title="Active Users"
          value={analytics?.total_users || 0}
          icon={Users}
          color="teal"
          trendLabel={`${analytics?.doctors || 0} doctors · ${analytics?.providers || 0} providers`}
          trend="neutral"
        />
        <StatCard
          title="Approval Rate"
          value={`${approvalRate}%`}
          icon={CheckCircle2}
          color="green"
          trendLabel={`${approved} approved · ${rejected} rejected`}
          trend="neutral"
        />
        <StatCard
          title="Pending Policies"
          value={analytics?.pending_policies || 0}
          icon={Shield}
          color="amber"
          trendLabel="Awaiting approval"
          trend="neutral"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Request Status</CardTitle>
          </CardHeader>
          <StatusPieChart data={analytics?.status_distribution || []} height={280} />
        </Card>

        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Requests Over Time</CardTitle>
            </CardHeader>
            <RequestsLineChart data={analytics?.requests_over_time || []} height={280} />
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            {recentActivity.length > 0 ? (
              <div className="space-y-1">
                {recentActivity.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-navy-800 rounded-lg transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activity.action?.includes("CREATED") ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400" :
                      activity.action?.includes("APPROVED") ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-500" :
                      activity.action?.includes("REJECTED") ? "bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-500" :
                      "bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-400"
                    }`}>
                      <Activity size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{activity.description || activity.action}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Activity}
                title="No recent activity"
                description="System activity will appear here as it happens."
              />
            )}
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
                <Brain size={18} className="text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">AI Decision Confidence</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {analytics?.avg_confidence || 0}% average across platform
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-navy-800 space-y-2">
            <button onClick={() => navigate("/admin-dashboard/users")}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300">
                <Users size={16} /> Manage Users
              </span>
              <ArrowRight size={14} className="text-slate-400" />
            </button>
            <button onClick={() => navigate("/admin-dashboard/policies")}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300">
                <Shield size={16} /> Review Policies
              </span>
              <StatusBadge status={analytics?.pending_policies ? "pending" : "approved"} />
            </button>
            <button onClick={() => navigate("/admin-dashboard/analytics")}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300">
                <AlertTriangle size={16} /> View Analytics
              </span>
              <ArrowRight size={14} className="text-slate-400" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}