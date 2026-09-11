import { Navigate } from "react-router-dom"

export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token")

  if (!token) {
    const loginMap = {
      doctor: "/doctor-login",
      provider: "/provider-login",
      patient: "/patient-login",
      admin: "/admin-login",
    }
    return <Navigate to={loginMap[requiredRole] || "/login"} replace />
  }

  let role = null
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    role = payload.role
  } catch {
    localStorage.clear()
    return <Navigate to="/login" replace />
  }

  if (requiredRole && role !== requiredRole) {
    const redirectMap = {
      doctor: "/doctor-dashboard",
      provider: "/provider-dashboard",
      patient: "/patient-dashboard",
      admin: "/admin-dashboard",
    }
    return <Navigate to={redirectMap[role] || "/"} replace />
  }

  return children
}
