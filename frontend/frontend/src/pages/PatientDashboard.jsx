import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Heart, FileText, CheckCircle2, Clock, ShieldCheck, ArrowRight, ClipboardList, Activity, Sparkles } from "lucide-react"
import { toast, friendlyMessage } from "../services/toast"
import PageHeader from "../components/ui/PageHeader"
import StatCard from "../components/ui/StatCard"
import Card, { CardHeader, CardTitle } from "../components/ui/Card"
import StatusBadge from "../components/ui/StatusBadge"
import EmptyState from "../components/ui/EmptyState"
import { SkeletonDashboard } from "../components/ui/Skeleton"
import StatusPieChart from "../components/charts/StatusPieChart"
import Button from "../components/ui/Button"

export default function PatientDashboard() {
  const navigate = useNavigate()
  const patientName = localStorage.getItem("patient_name") || "Patient"
  const token = localStorage.getItem("access_token")
  const [stats, setStats] = useState(null)
  const [profile, setProfile] = useState(null)
  const [recentRequests, setRecentRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const headers = { Authorization: `Bearer ${token}` }
        const [statsRes, requestsRes, profileRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/patient/stats`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/patient/requests?page_size=5`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/patient/profile`, { headers }),
        ])
        const statsData = await statsRes.json()
        const requestsData = await requestsRes.json()
        const profileData = await profileRes.json()
        setStats(statsData)
        setRecentRequests(requestsData.items || [])
        setProfile(profileData)
      } catch (e) { toast.error(friendlyMessage(e)) }
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return <SkeletonDashboard />
  }

  const coverageStatus = profile?.coverage_status || profile?.member_status || null

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${patientName}`}
        description="Track your authorization requests and insurance details."
        icon={Heart}
        actions={[
          <Button key="all" onClick={() => navigate("/patient-dashboard/requests")}>
            <ClipboardList size={16} /> View All Requests <ArrowRight size={16} />
          </Button>,
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Insurance Status"
          value={coverageStatus || "—"}
          icon={ShieldCheck}
          color="teal"
          trendLabel={profile?.insurance_provider || "No provider linked"}
          trend="neutral"
        />
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
          trendLabel="Successfully approved"
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
                description="Your doctor will submit authorization requests on your behalf."
              />
            ) : (
              <div className="space-y-3">
                {recentRequests.map((req) => (
                  <div key={req.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-4 py-3.5 border border-slate-100 dark:border-navy-800 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-800/50 hover:border-slate-200 dark:hover:border-navy-700 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-teal-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">{req.procedure_code}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{req.diagnosis?.substring(0, 60)}</p>
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

        <div className="bg-gradient-to-br from-teal-950 to-navy-900 rounded-xl p-6 text-white relative overflow-hidden xl:max-h-[560px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-5">
            <div className="w-11 h-11 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
              <Sparkles className="text-teal-300" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Transparent Authorizations</h2>
              <p className="text-slate-300 mt-2 text-sm leading-6">
                See every step of your prior authorization journey, explained in plain language.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <Activity className="text-teal-300" size={18} />
                <span className="text-sm font-medium">Real-Time Status</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-teal-300" size={18} />
                <span className="text-sm font-medium">Secure Processing</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </div>
            <Button
              variant="ghost"
              className="w-full !text-white hover:!bg-white/10 border border-white/10 justify-center"
              onClick={() => navigate("/patient-dashboard/requests")}
            >
              View Request History <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}