import { useState } from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { Menu, X, Bell, Moon, Sun, LogOut, ChevronLeft } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import PageTransition from "./PageTransition"

export default function AppLayout({ sidebarLinks, branding, userName, userRole, onLogout, accentColor = "brand" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { darkMode, toggleTheme } = useTheme()

  const isActive = (path) => location.pathname === path

  const accentClasses = {
    brand: {
      active: "bg-brand-700 text-white",
      hover: "hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/20",
      logo: "bg-brand-700",
      header: "text-brand-700 dark:text-brand-400",
    },
    teal: {
      active: "bg-teal-700 text-white",
      hover: "hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-900/20",
      logo: "bg-teal-700",
      header: "text-teal-700 dark:text-teal-400",
    },
    emerald: {
      active: "bg-emerald-700 text-white",
      hover: "hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20",
      logo: "bg-emerald-700",
      header: "text-emerald-700 dark:text-emerald-400",
    },
    rose: {
      active: "bg-rose-600 text-white",
      hover: "hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/20",
      logo: "bg-rose-600",
      header: "text-rose-700 dark:text-rose-400",
    },
  }

  const accent = accentClasses[accentColor] || accentClasses.brand

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-navy-950">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-navy-950/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-navy-800 transition-all duration-200 ${
        collapsed ? "w-[68px]" : "w-64"
      } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-slate-200 dark:border-navy-800 ${collapsed ? "justify-center px-2" : "px-5 gap-3"}`}>
          {!collapsed && (
            <Link to={branding.homePath} className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-8 h-8 rounded-lg ${accent.logo} flex items-center justify-center flex-shrink-0`}>
                <branding.icon size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">Zintellect AI</h1>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{branding.subtitle}</p>
              </div>
            </Link>
          )}
          {collapsed && (
            <div className={`w-8 h-8 rounded-lg ${accent.logo} flex items-center justify-center`}>
              <branding.icon size={18} className="text-white" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1 rounded-md hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft size={16} className={`text-slate-400 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.path)
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? link.title : undefined}
                className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                } ${
                  active
                    ? `${accent.active} shadow-sm`
                    : `text-slate-600 dark:text-slate-400 ${accent.hover}`
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{link.title}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="py-3 px-2 border-t border-slate-200 dark:border-navy-800 space-y-0.5">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 w-full rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`}
            title={collapsed ? (darkMode ? "Light Mode" : "Dark Mode") : undefined}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <button
            onClick={onLogout}
            className={`flex items-center gap-3 w-full rounded-lg text-sm font-medium text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-slate-400 dark:text-slate-500">Welcome,</span>
              <span className="font-semibold text-slate-900 dark:text-white">{userName}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400">
                {userRole}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors" aria-label="Notifications">
              <Bell size={18} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  )
}
