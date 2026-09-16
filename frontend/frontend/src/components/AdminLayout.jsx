import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Users, FileText, BarChart3, Clock, Settings,
  Shield, ClipboardList
} from "lucide-react"
import AppLayout from "./AppLayout"

const sidebarLinks = [
  { title: "Dashboard", path: "/admin-dashboard", icon: LayoutDashboard },
  { title: "Users", path: "/admin-dashboard/users", icon: Users },
  { title: "Policies", path: "/admin-dashboard/policies", icon: FileText },
  { title: "Analytics", path: "/admin-dashboard/analytics", icon: BarChart3 },
  { title: "Audit Log", path: "/admin-dashboard/audit", icon: ClipboardList },
  { title: "Settings", path: "/admin-dashboard/settings", icon: Settings },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const adminName = localStorage.getItem("admin_name") || "Administrator"

  const handleLogout = () => {
    localStorage.removeItem("admin_id")
    localStorage.removeItem("admin_name")
    localStorage.removeItem("access_token")
    navigate("/admin-login")
  }

  return (
    <AppLayout
      sidebarLinks={sidebarLinks}
      branding={{
        icon: Shield,
        subtitle: "Admin Panel",
        homePath: "/admin-dashboard",
      }}
      userName={adminName}
      userRole="admin"
      onLogout={handleLogout}
      accentColor="brand"
    />
  )
}
