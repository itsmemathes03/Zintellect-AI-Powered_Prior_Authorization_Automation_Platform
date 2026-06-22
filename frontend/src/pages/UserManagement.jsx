import { useState, useEffect, useCallback } from "react"
import {
  Plus, Edit3, Trash2, X, UserPlus, Loader, Mail, Shield, Phone, Calendar,
  Search, Filter, Users as UsersIcon
} from "lucide-react"
import { getAdminUsers, createUser, updateUser, deleteUser } from "../services/api"
import AdminTable from "../components/AdminTable"
import PasswordStrengthMeter from "../components/PasswordStrengthMeter"
import { useToast } from "../components/Toast"

const roleOptions = ["Doctor", "Provider", "Patient", "Admin"]

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

  const columns = [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "role", label: "Role", sortable: true },
    { key: "phone", label: "Phone" },
    { key: "is_active", label: "Status" },
    { key: "created_at", label: "Created", sortable: true },
    { key: "actions", label: "Actions" },
  ]

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

  const handleDelete = (user) => setDeleteConfirm(user)

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteUser(deleteConfirm.id)
      addToast("User deactivated successfully", "success")
      setDeleteConfirm(null)
      loadUsers()
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to deactivate user", "error")
    }
  }

  const formatDate = (d) => {
    if (!d) return "-"
    return new Date(d).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage all platform users</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setForm(initialForm); setShowModal(true) }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 hover:shadow-lg hover:shadow-blue-200 dark:hover:shadow-blue-900/30 transition-all shadow-md"
        >
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            className="pl-10 pr-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Roles</option>
            {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={users}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        onSearch={(val) => { setSearch(val); setPage(1) }}
        searchPlaceholder="Search users by name or email..."
        emptyMessage="No users found"
        renderRow={(user) => (
          <>
            <td className="px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {(user.first_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    {user.first_name || user.last_name ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "—"}
                  </p>
                </div>
              </div>
            </td>
            <td className="px-4 py-4 text-slate-600 dark:text-slate-400 text-sm">{user.email}</td>
            <td className="px-4 py-4">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                user.role === "Admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                user.role === "Doctor" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                user.role === "Provider" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              }`}>
                {user.role}
              </span>
            </td>
            <td className="px-4 py-4 text-slate-600 dark:text-slate-400 text-sm">{user.phone || "—"}</td>
            <td className="px-4 py-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                user.is_active
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </td>
            <td className="px-4 py-4 text-slate-600 dark:text-slate-400 text-sm">{formatDate(user.created_at)}</td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(user)}
                  className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-all hover:scale-110">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(user)}
                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-all hover:scale-110">
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </>
        )}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-blue-100 dark:border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in">
            <div className="flex items-center justify-between p-6 border-b border-blue-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingUser ? "Edit User" : "Add User"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                  <input type="text" value={form.first_name} onChange={(e) => setForm({...form, first_name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input type="text" value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                  <PasswordStrengthMeter password={form.password} />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Role *</label>
                <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm">
                  {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>
              {form.role === "Doctor" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Hospital</label>
                    <input type="text" value={form.hospital_name} onChange={(e) => setForm({...form, hospital_name: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Specialization</label>
                    <input type="text" value={form.specialization} onChange={(e) => setForm({...form, specialization: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">License Number</label>
                    <input type="text" value={form.license_number} onChange={(e) => setForm({...form, license_number: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                  </div>
                </>
              )}
              {form.role === "Provider" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Provider Name</label>
                  <input type="text" value={form.provider_name} onChange={(e) => setForm({...form, provider_name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-blue-100 dark:border-slate-700">
              <button onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:scale-105 hover:shadow-lg hover:shadow-blue-200 dark:hover:shadow-blue-900/30 transition-all disabled:opacity-50">
                {saving ? "Saving..." : editingUser ? "Update User" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-blue-100 dark:border-slate-700 w-full max-w-md p-6">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="text-red-600" size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Deactivate User</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center">Are you sure you want to deactivate <strong>{deleteConfirm.email}</strong>? They will lose platform access.</p>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-6 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold hover:scale-105 transition-all shadow-lg flex items-center gap-2">
                <Trash2 size={16} />
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
