import { useState } from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Users, FileText, Settings, LogOut, Menu, Stethoscope, Bell, Activity, ClipboardList
} from "lucide-react"
import ParticleBackground from "./ParticleBackground"
import PageTransition from "./PageTransition"

const sidebarLinks = [
  { title: "Dashboard", path: "/doctor-dashboard", icon: LayoutDashboard },
  { title: "Patients", path: "/doctor-dashboard/patients", icon: Users },
  { title: "Requests", path: "/doctor-dashboard/requests", icon: ClipboardList },
  { title: "Settings", path: "/doctor-dashboard/settings", icon: Settings },
]

export default function DoctorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const doctorName = localStorage.getItem("doctor_name") || "Doctor"

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("doctor_id")
    localStorage.removeItem("doctor_name")
    navigate("/doctor-login")
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-sky-50/20 dark:from-slate-950 dark:via-cyan-950/30 dark:to-sky-950/30 flex relative overflow-x-clip">
      <ParticleBackground r={6} g={182} b={212} />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky lg:top-0 lg:self-start lg:h-screen inset-y-0 left-0 z-50 w-72 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-r border-cyan-100 dark:border-cyan-900/40 flex flex-col transition-all duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="p-6 border-b border-cyan-100 dark:border-cyan-900/40">
          <Link to="/doctor-dashboard" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-600 to-sky-600 flex items-center justify-center shadow-lg shadow-cyan-200/50 dark:shadow-cyan-950 group-hover:scale-110 transition-transform">
              <Stethoscope className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-cyan-700 to-sky-600 dark:from-cyan-300 dark:to-sky-400 bg-clip-text text-transparent">Zintellect AI</h1>
              <p className="text-[10px] text-cyan-500 dark:text-cyan-400 tracking-widest uppercase font-semibold">Doctor Portal</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 group ${
                  isActive(link.path)
                    ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-lg shadow-cyan-200/50 dark:shadow-cyan-950 scale-[1.02]"
                    : "text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 hover:text-cyan-700 dark:hover:text-cyan-300"
                }`}
              >
                <Icon size={20} className={isActive(link.path) ? "" : "group-hover:scale-110 transition-transform"} />
                {link.title}
                {isActive(link.path) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-cyan-100 dark:border-cyan-900/40">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-cyan-100 dark:border-cyan-900/40">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-2xl hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-colors"
            >
              <Menu size={22} className="text-slate-600 dark:text-slate-200" />
            </button>

            <div className="hidden lg:flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-100 to-sky-100 dark:from-cyan-900/60 dark:to-sky-900/60 flex items-center justify-center">
                <Activity className="text-cyan-600 dark:text-cyan-300" size={16} />
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">Welcome,</span>
              <span className="text-sm font-bold bg-gradient-to-r from-cyan-700 to-sky-600 dark:from-cyan-300 dark:to-sky-400 bg-clip-text text-transparent">{doctorName}</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="relative p-2.5 rounded-2xl hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-colors group">
                <Bell size={20} className="text-slate-600 dark:text-slate-200 group-hover:scale-110 transition-transform" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 relative">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  )
}