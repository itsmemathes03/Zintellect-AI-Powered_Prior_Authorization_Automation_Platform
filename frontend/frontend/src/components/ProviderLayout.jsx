import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard, ClipboardList, ShieldCheck, Mail, Settings, Building2
} from "lucide-react"
import AppLayout from "./AppLayout"

const sidebarLinks = [
  { title: "Dashboard", path: "/provider-dashboard", icon: LayoutDashboard },
  { title: "Requests", path: "/provider-dashboard/requests", icon: ClipboardList },
  { title: "Review Queue", path: "/provider-dashboard/review-queue", icon: ClipboardList },
  { title: "Policies", path: "/provider-dashboard/policies", icon: ShieldCheck },
  { title: "Email History", path: "/provider-dashboard/email-history", icon: Mail },
  { title: "Settings", path: "/provider-dashboard/settings", icon: Settings },
]

export default function ProviderLayout() {
  const navigate = useNavigate()
  const providerName = localStorage.getItem("provider_name") || "Provider"

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("provider_id")
    localStorage.removeItem("provider_name")
    navigate("/provider-login")
  }

  return (
    <AppLayout
      sidebarLinks={sidebarLinks}
      branding={{
        icon: Building2,
        subtitle: "Provider Portal",
        homePath: "/provider-dashboard",
      }}
      userName={providerName}
      userRole="provider"
      onLogout={handleLogout}
      accentColor="emerald"
    />
  )
}
