import { useState } from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, FileText, Settings, LogOut, Menu, Building2, Bell, Activity, ClipboardList, ShieldCheck, Mail
} from "lucide-react"
import ParticleBackground from "./ParticleBackground"
import PageTransition from "./PageTransition"

const sidebarLinks = [
  { title: "Dashboard", path: "/provider-dashboard", icon: LayoutDashboard },
  { title: "Requests", path: "/provider-dashboard/requests", icon: ClipboardList },
  { title: "Email History", path: "/provider-dashboard/email-history", icon: Mail },
  { title: "Settings", path: "/provider-dashboard/settings", icon: Settings },
]

export default function ProviderLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const providerName = localStorage.getItem("provider_name") || "Provider"

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("provider_id")
    localStorage.removeItem("provider_name")
    navigate("/provider-login")
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/20 flex relative">
      <ParticleBackground r={16} g={185} b={129} />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-emerald-100 flex flex-col transition-all duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="p-6 border-b border-emerald-100">
          <Link to="/provider-dashboard" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
              <Building2 className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">Zintellect AI</h1>
              <p className="text-[10px] text-emerald-500 tracking-widest uppercase font-semibold">Provider Portal</p>
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
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-200 scale-[1.02]"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
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

        <div className="p-4 border-t border-emerald-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-emerald-100">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-2xl hover:bg-emerald-50 transition-colors"
            >
              <Menu size={22} className="text-slate-600" />
            </button>

            <div className="hidden lg:flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <Activity className="text-emerald-600" size={16} />
              </div>
              <span className="text-sm text-slate-500">Welcome,</span>
              <span className="text-sm font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">{providerName}</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="relative p-2.5 rounded-2xl hover:bg-emerald-50 transition-colors group">
                <Bell size={20} className="text-slate-600 group-hover:scale-110 transition-transform" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
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
