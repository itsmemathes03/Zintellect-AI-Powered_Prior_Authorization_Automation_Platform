import { useState, useEffect } from "react"
import {
  BarChart3, TrendingUp, Download, Users, CheckCircle2, XCircle, Clock, Activity, FileText, Brain
} from "lucide-react"
import { getAdminAnalytics } from "../services/api"
import Papa from "papaparse"
import { useToast } from "../components/Toast"
import StatusPieChart from "../components/charts/StatusPieChart"
import RequestsLineChart from "../components/charts/RequestsLineChart"
import UserBarChart from "../components/charts/UserBarChart"
import PageHeader from "../components/ui/PageHeader"
import PageTransition from "../components/PageTransition"
import Card, { CardHeader, CardTitle } from "../components/ui/Card"
import StatCard from "../components/ui/StatCard"
import Button from "../components/ui/Button"
import { SkeletonDashboard } from "../components/ui/Skeleton"

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
    return <SkeletonDashboard />
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="System Analytics"
          description="Detailed platform metrics and performance data"
          icon={BarChart3}
          actions={[
            <Button
              key="export"
              variant="secondary"
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
            >
              <Download size={16} /> Export CSV
            </Button>,
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Requests" value={analytics?.total_requests || 0} icon={Activity} color="brand" />
          <StatCard title="Approved" value={analytics?.approved_requests || 0} icon={CheckCircle2} color="green" />
          <StatCard title="Rejected" value={analytics?.rejected_requests || 0} icon={XCircle} color="red" />
          <StatCard title="Pending" value={analytics?.pending_requests || 0} icon={Clock} color="amber" />
          <StatCard title="Manual Review" value={analytics?.manual_review_requests || 0} icon={Brain} color="purple" />
          <StatCard title="Avg Confidence" value={`${analytics?.avg_confidence || 0}%`} icon={TrendingUp} color="teal" />
          <StatCard title="Total Users" value={analytics?.total_users || 0} icon={Users} color="purple" />
          <StatCard title="Pending Policies" value={analytics?.pending_policies || 0} icon={FileText} color="amber" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={18} className="text-teal-600" /> User Breakdown
            </CardTitle>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const data = [
                  { role: "Doctors", count: analytics?.doctors },
                  { role: "Providers", count: analytics?.providers },
                  { role: "Patients", count: analytics?.patients },
                  { role: "Admins", count: analytics?.admins },
                ]
                exportCSV(data, "user-breakdown.csv")
              }}
            >
              <Download size={14} /> Export
            </Button>
          </CardHeader>
          <UserBarChart
            data={[
              { label: "Doctors", value: analytics?.doctors || 0 },
              { label: "Providers", value: analytics?.providers || 0 },
              { label: "Patients", value: analytics?.patients || 0 },
              { label: "Admins", value: analytics?.admins || 0 },
            ]}
            height={250}
          />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={18} className="text-brand-600" /> Request Status Distribution
              </CardTitle>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportCSV(analytics?.status_distribution || [], "status-distribution.csv")}
              >
                <Download size={14} /> Export
              </Button>
            </CardHeader>
            <StatusPieChart data={analytics?.status_distribution || []} height={320} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-600" /> Requests Over Time
              </CardTitle>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportCSV(analytics?.requests_over_time || [], "requests-over-time.csv")}
              >
                <Download size={14} /> Export
              </Button>
            </CardHeader>
            <RequestsLineChart data={analytics?.requests_over_time || []} height={320} />
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}