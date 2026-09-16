import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Stethoscope, Users, FileText, CheckCircle2, Clock, Activity, Brain, ArrowRight, ClipboardList, Sparkles } from "lucide-react"
import { toast, friendlyMessage } from "../services/toast"
import PageHeader from "../components/ui/PageHeader"
import StatCard from "../components/ui/StatCard"
import Card, { CardHeader, CardTitle } from "../components/ui/Card"
import StatusBadge from "../components/ui/StatusBadge"
import EmptyState from "../components/ui/EmptyState"
import { SkeletonDashboard } from "../components/ui/Skeleton"
import StatusPieChart from "../components/charts/StatusPieChart"
import Button from "../components/ui/Button"

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const doctorName = localStorage.getItem("doctor_name") || "Doctor"
  const token = localStorage.getItem("access_token")
  const [stats, setStats] = useState(null)
  const [recentRequests, setRecentRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const headers = { Authorization: `Bearer ${token}` }
        const [statsRes, requestsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/doctor/stats`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/doctor/requests?page_size=5`, { headers }),
        ])
        const statsData = await statsRes.json()
        const requestsData = await requestsRes.json()
        setStats(statsData)
        setRecentRequests(requestsData.items || [])
      } catch (e) { toast.error(friendlyMessage(e)) }
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return <SkeletonDashboard />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, Dr. ${doctorName}`}
        description="Manage your prior authorization requests and patients."
        icon={Stethoscope}
        actions={[
          <Button key="all" onClick={() => navigate("/doctor-dashboard/requests")}>
            <ClipboardList size={16} /> View All Requests <ArrowRight size={16} />
          </Button>,
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={stats?.total_requests || 0}
          icon={FileText}
          color="brand"
          trendLabel="All time submissions"
          trend="neutral"
        />
        <StatCard
          title="Approved"
          value={stats?.approved || 0}
          icon={CheckCircle2}
          color="green"
          trendLabel={`${stats?.approval_rate || 0}% approval rate`}
          trend="up"
        />
        <StatCard
          title="Pending"
          value={stats?.pending || 0}
          icon={Clock}
          color="amber"
          trendLabel="Awaiting decision"
          trend="neutral"
        />
        <StatCard
          title="Patients"
          value={stats?.total_patients || 0}
          icon={Users}
          color="teal"
          trendLabel="Unique patients"
          trend="neutral"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Request Status</CardTitle>
          </CardHeader>
          <StatusPieChart
            data={[
              { status: "Approved", count: stats?.approved || 0 },
              { status: "Pending", count: stats?.pending || 0 },
              { status: "Rejected", count: stats?.rejected || 0 },
              { status: "Manual Review", count: stats?.manual_review || 0 },
            ].filter((d) => d.count > 0)}
            height={260}
          />
        </Card>

        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
            </CardHeader>
            {recentRequests.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Requests Yet"
                description="Submit your first prior authorization request to get started."
                action={
                  <Button onClick={() => navigate("/doctor-dashboard/requests")}>
                    Submit a Request
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {recentRequests.map((req) => (
                  <div key={req.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-4 py-3.5 border border-slate-100 dark:border-navy-800 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-800/50 hover:border-slate-200 dark:hover:border-navy-700 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-navy-800 flex items-center justify-center flex-shrink-0">
                        <Stethoscope size={16} className="text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">{req.patient_name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {req.procedure_code} · {req.diagnosis?.substring(0, 60)}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{req.id?.substring(0, 8)}...</p>
                      </div>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="bg-gradient-to-br from-navy-950 to-brand-950 rounded-xl p-6 text-white relative overflow-hidden xl:max-h-[560px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-5">
            <div className="w-11 h-11 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
              <Sparkles className="text-teal-300" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI-Assisted Authorizations</h2>
              <p className="text-slate-300 mt-2 text-sm leading-6">
                Submit clinical evidence once and let the AI pipeline draft the prior authorization workflow for review.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <Brain className="text-teal-300" size={18} />
                <span className="text-sm font-medium">AI Decision Support</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <Activity className="text-teal-300" size={18} />
                <span className="text-sm font-medium">Real-Time Status Tracking</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </div>
            <Button
              variant="ghost"
              className="w-full !text-white hover:!bg-white/10 border border-white/10 justify-center"
              onClick={() => navigate("/new-request")}
            >
              Create New Request <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}