import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Settings, Heart, ClipboardList
} from "lucide-react"
import AppLayout from "./AppLayout"

const sidebarLinks = [
  { title: "Dashboard", path: "/patient-dashboard", icon: LayoutDashboard },
  { title: "My Requests", path: "/patient-dashboard/requests", icon: ClipboardList },
  { title: "Settings", path: "/patient-dashboard/settings", icon: Settings },
]

export default function PatientLayout() {
  const navigate = useNavigate()
  const patientName = localStorage.getItem("patient_name") || "Patient"

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("patient_name")
    localStorage.removeItem("patient_email")
    localStorage.removeItem("insurance_provider")
    localStorage.removeItem("insurance_id")
    localStorage.removeItem("policy_number")
    localStorage.removeItem("coverage_status")
    navigate("/patient-login")
  }

  return (
    <AppLayout
      sidebarLinks={sidebarLinks}
      branding={{
        icon: Heart,
        subtitle: "Patient Portal",
        homePath: "/patient-dashboard",
      }}
      userName={patientName}
      userRole="patient"
      onLogout={handleLogout}
      accentColor="rose"
    />
  )
}
