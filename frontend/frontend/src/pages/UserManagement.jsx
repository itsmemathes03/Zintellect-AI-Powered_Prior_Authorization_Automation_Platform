import { useState, useEffect, useCallback } from "react"
import {
  Plus, Edit3, Trash2, UserPlus, Mail, Phone, Filter, Users as UsersIcon,
  ChevronLeft, ChevronRight, Stethoscope, Building2, Lock
} from "lucide-react"
import { getAdminUsers, createUser, updateUser, deleteUser } from "../services/api"
import PasswordStrengthMeter from "../components/PasswordStrengthMeter"
import { useToast } from "../components/Toast"
import PageHeader from "../components/ui/PageHeader"
import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"
import DataTable from "../components/ui/DataTable"
import Modal from "../components/ui/Modal"
import ConfirmationDialog from "../components/ui/ConfirmationDialog"
import Button from "../components/ui/Button"

const roleOptions = ["Doctor", "Provider", "Patient", "Admin"]

const roleBadgeColor = {
  Admin: "purple",
  Doctor: "blue",
  Provider: "green",
  Patient: "amber",
}

const initialForm = {
  email: "", password: "", role: "Doctor",
  first_name: "", last_name: "", phone: "",
  hospital_name: "", specialization: "", license_number: "", provider_name: ""
}

export default function UserManagement() {
  const { addToast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize }
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter
      const res = await getAdminUsers(params)
      setUsers(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      addToast("Failed to load users", "error")
    }
    setLoading(false)
  }, [page, pageSize, search, roleFilter, addToast])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleSave = async () => {
    if (!form.email || (!editingUser && !form.password)) {
      addToast("Email and password are required", "error")
      return
    }
    setSaving(true)
    try {
      if (editingUser) {
        const payload = { ...form }
        delete payload.password
        await updateUser(editingUser.id, payload)
        addToast("User updated successfully", "success")
      } else {
        await createUser(form)
        addToast("User created successfully", "success")
      }
      setShowModal(false)
      setEditingUser(null)
      setForm(initialForm)
      loadUsers()
    } catch (err) {
      addToast(err.response?.data?.detail || "Operation failed", "error")
    }
    setSaving(false)
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setForm({
      email: user.email || "", password: "", role: user.role || "Doctor",
      first_name: user.first_name || "", last_name: user.last_name || "",
      phone: user.phone || "", hospital_name: user.hospital_name || "",
      specialization: user.specialization || "", license_number: user.license_number || "",
      provider_name: user.provider_name || "",
    })
    setShowModal(true)
  }

  const openAddModal = () => {
    setEditingUser(null)
    setForm(initialForm)
    setShowModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await deleteUser(deleteConfirm.id)
      addToast("User deactivated successfully", "success")
      setDeleteConfirm(null)
      loadUsers()
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to deactivate user", "error")
    }
    setDeleting(false)
  }

  const formatDate = (d) => {
    if (!d) return "-"
    return new Date(d).toLocaleDateString()
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const columns = [
    {
      header: "Name",
      width: "22%",
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0 ring-1 ring-brand-600/10">
            <span className="text-xs font-bold text-brand-700 dark:text-brand-300">
              {(user.first_name?.[0] || user.email?.[0] || "?").toUpperCase()}
            </span>
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">
            {user.first_name || user.last_name ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Email",
      width: "22%",
      render: (user) => <span className="text-slate-600 dark:text-slate-400">{user.email}</span>,
    },
    {
      header: "Role",
      render: (user) => <Badge color={roleBadgeColor[user.role] || "gray"}>{user.role}</Badge>,
    },
    { header: "Phone", render: (user) => <span className="text-slate-600 dark:text-slate-400">{user.phone || "—"}</span> },
    {
      header: "Status",
      render: (user) => (
        <Badge color={user.is_active ? "green" : "red"} dot>
          {user.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    { header: "Created", render: (user) => <span className="text-slate-600 dark:text-slate-400">{formatDate(user.created_at)}</span> },
    {
      className: "text-right",
      cellClassName: "text-right",
      render: (user) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => handleEdit(user)}
            className="p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-600 dark:text-brand-400 transition-colors"
            aria-label="Edit user">
            <Edit3 size={16} />
          </button>
          <button onClick={() => setDeleteConfirm(user)}
            className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-500/10 text-danger-600 dark:text-danger-500 transition-colors"
            aria-label="Delete user">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  const inputClass = "input-field"

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage all platform users"
        icon={UsersIcon}
        actions={[
          <Button key="add" onClick={openAddModal}>
            <UserPlus size={16} /> Add User
          </Button>,
        ]}
      />

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            className="input-field pl-9"
          >
            <option value="">All Roles</option>
            {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="input-field"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No users found"
      />

      {!loading && users.length > 0 && totalPages > 1 && (
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

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? "Edit User" : "Add User"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </div>
          {!editingUser && (
            <div>
              <label className="label">Password *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
              <PasswordStrengthMeter password={form.password} />
            </div>
          )}
          <div>
            <label className="label">Role *</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass}>
              {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          </div>
          {form.role === "Doctor" && (
            <>
              <div>
                <label className="label">Hospital</label>
                <input type="text" value={form.hospital_name} onChange={(e) => setForm({ ...form, hospital_name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="label">Specialization</label>
                <input type="text" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="label">License Number</label>
                <input type="text" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} className={inputClass} />
              </div>
            </>
          )}
          {form.role === "Provider" && (
            <div>
              <label className="label">Provider Name</label>
              <input type="text" value={form.provider_name} onChange={(e) => setForm({ ...form, provider_name: e.target.value })} className={inputClass} />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-navy-800">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} loading={saving}>
            {saving ? "Saving..." : editingUser ? "Update User" : "Create User"}
          </Button>
        </div>
      </Modal>

      {deleteConfirm && (
        <ConfirmationDialog
          open
          onClose={() => setDeleteConfirm(null)}
          onConfirm={confirmDelete}
          loading={deleting}
          variant="danger"
          title="Deactivate User"
          message={`Are you sure you want to deactivate ${deleteConfirm.email}? They will lose platform access.`}
          confirmLabel="Deactivate"
        />
      )}
    </div>
  )
}