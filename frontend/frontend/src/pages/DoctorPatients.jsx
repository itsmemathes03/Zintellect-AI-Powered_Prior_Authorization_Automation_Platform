import { useState, useEffect } from "react"
import { Search, Users, UserRound, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "../components/Toast"
import PageHeader from "../components/ui/PageHeader"
import Badge from "../components/ui/Badge"
import DataTable from "../components/ui/DataTable"
import Button from "../components/ui/Button"

const statusColor = {
  Approved: "green",
  Pending: "amber",
  Rejected: "red",
  "Manual Review": "orange",
}

export default function DoctorPatients() {
  const token = localStorage.getItem("access_token")
  const { addToast } = useToast()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15

  useEffect(() => { fetchPatients() }, [page, search])

  async function fetchPatients() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, page_size: pageSize })
      if (search) params.append("search", search)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/doctor/patients?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setPatients(data.items || [])
      setTotal(data.total || 0)
    } catch (e) { console.log(e); addToast("Failed to load patients", "error") }
    setLoading(false)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const columns = [
    {
      header: "Patient Name",
      width: "22%",
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0 ring-1 ring-brand-600/10">
            <UserRound size={16} className="text-brand-600 dark:text-brand-400" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">{p.patient_name}</span>
        </div>
      ),
    },
    { header: "Patient ID", render: (p) => <span className="font-mono text-sm text-slate-600 dark:text-slate-400">{p.patient_id}</span> },
    { header: "Insurance", render: (p) => <span className="text-slate-700 dark:text-slate-300">{p.insurance_provider || "-"}</span> },
    { header: "Diagnosis", cellClassName: "max-w-[200px]", render: (p) => <span className="text-sm text-slate-600 dark:text-slate-400 block truncate">{p.diagnosis || "-"}</span> },
    {
      header: "Requests",
      className: "text-center",
      cellClassName: "text-center",
      render: (p) => <Badge color="blue">{p.total_requests ?? "-"}</Badge>,
    },
    {
      header: "Last Status",
      render: (p) => <Badge color={statusColor[p.last_status] || "gray"}>{p.last_status || "N/A"}</Badge>,
    },
    {
      header: "Last Active",
      render: (p) => <span className="text-sm text-slate-500 dark:text-slate-400">{p.last_request_date ? new Date(p.last_request_date).toLocaleDateString() : "-"}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Patients"
        description={`${total} total patients`}
        icon={Users}
      />

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search patients by name or ID..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="input-field pl-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={patients}
        loading={loading}
        emptyMessage="No patients found yet"
      />

      {!loading && patients.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} aria-label="Previous page">
              <ChevronLeft size={16} />
            </Button>
            <Badge color="gray" className="px-3 py-1.5 tabular-nums">Page {page} of {totalPages}</Badge>
            <Button variant="secondary" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label="Next page">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}