import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Users, Settings, Stethoscope, ClipboardList
} from "lucide-react"
import AppLayout from "./AppLayout"

const sidebarLinks = [
  { title: "Dashboard", path: "/doctor-dashboard", icon: LayoutDashboard },
  { title: "Patients", path: "/doctor-dashboard/patients", icon: Users },
  { title: "Requests", path: "/doctor-dashboard/requests", icon: ClipboardList },
  { title: "Settings", path: "/doctor-dashboard/settings", icon: Settings },
]

export default function DoctorLayout() {
  const navigate = useNavigate()
  const doctorName = localStorage.getItem("doctor_name") || "Doctor"

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("doctor_id")
    localStorage.removeItem("doctor_name")
    navigate("/doctor-login")
  }

  return (
    <AppLayout
      sidebarLinks={sidebarLinks}
      branding={{
        icon: Stethoscope,
        subtitle: "Doctor Portal",
        homePath: "/doctor-dashboard",
      }}
      userName={doctorName}
      userRole="doctor"
      onLogout={handleLogout}
      accentColor="teal"
    />
  )
}
