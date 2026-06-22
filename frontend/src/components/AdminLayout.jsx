import { useState } from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Users, FileText, BarChart3, Clock, Settings, LogOut, Menu, X, Moon, Sun, Shield, Bell
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import ParticleBackground from "./ParticleBackground"
import PageTransition from "./PageTransition"

const sidebarLinks = [
  { title: "Dashboard", path: "/admin-dashboard", icon: LayoutDashboard },
  { title: "Users", path: "/admin-dashboard/users", icon: Users },
  { title: "Policies", path: "/admin-dashboard/policies", icon: FileText },
  { title: "Analytics", path: "/admin-dashboard/analytics", icon: BarChart3 },
  { title: "Audit", path: "/admin-dashboard/audit", icon: Clock },
  { title: "Settings", path: "/admin-dashboard/settings", icon: Settings },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { darkMode, toggleTheme } = useTheme()
  const adminName = localStorage.getItem("admin_name") || "Administrator"

  const handleLogout = () => {
    localStorage.removeItem("admin_id")
    localStorage.removeItem("admin_name")
    localStorage.removeItem("access_token")
    navigate("/admin-login")
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex relative">
      <ParticleBackground />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-blue-100 dark:border-slate-700 flex flex-col transition-all duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="p-6 border-b border-blue-100 dark:border-slate-700">
          <Link to="/admin-dashboard" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/30 group-hover:scale-110 transition-transform">
              <Shield className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">Zintellect AI</h1>
              <p className="text-[10px] text-blue-500 dark:text-blue-400 tracking-widest uppercase font-semibold">Admin Panel</p>
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
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30 scale-[1.02]"
                    : "text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700/50 hover:text-blue-700 dark:hover:text-blue-300"
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

        <div className="p-4 border-t border-blue-100 dark:border-slate-700 space-y-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700/50 hover:text-blue-700 dark:hover:text-blue-300 transition-all group"
          >
            {darkMode ? <Sun size={20} className="group-hover:scale-110 transition-transform" /> : <Moon size={20} className="group-hover:scale-110 transition-transform" />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-b border-blue-100 dark:border-slate-700">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-2xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Menu size={22} className="text-slate-600 dark:text-slate-300" />
            </button>

            <div className="hidden lg:flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                <Shield className="text-blue-600 dark:text-blue-400" size={16} />
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">Welcome,</span>
              <span className="text-sm font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">{adminName}</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="relative p-2.5 rounded-2xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group">
                <Bell size={20} className="text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
              </button>
              <button
                onClick={toggleTheme}
                className="hidden lg:flex p-2.5 rounded-2xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
              >
                {darkMode ? <Sun size={20} className="text-slate-600 dark:text-slate-300" /> : <Moon size={20} className="text-slate-600 dark:text-slate-300" />}
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
