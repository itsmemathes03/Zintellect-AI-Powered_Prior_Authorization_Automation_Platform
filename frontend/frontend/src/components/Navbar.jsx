import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X, Shield, BrainCircuit, Stethoscope, UserRound } from "lucide-react"

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()

  const isAdminLoggedIn = !!(localStorage.getItem("access_token") || localStorage.getItem("token"))

  const navItems = [
    { title: "Home", path: "/", icon: BrainCircuit },
    { title: "Doctor", path: "/doctor-login", icon: Stethoscope },
    { title: "Provider", path: "/provider-login", icon: Shield },
    { title: "Patient", path: "/patient-register", icon: UserRound },
    { title: "Admin", path: isAdminLoggedIn ? "/admin-dashboard" : "/admin-login", icon: Shield },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 dark:bg-navy-900/90 dark:border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16">
        <div className="flex items-center justify-between h-full">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-700 flex items-center justify-center">
              <BrainCircuit size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Zintellect AI</h1>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">Prior Authorization Platform</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.title}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive(item.path)
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800"
                  }`}
                >
                  <Icon size={16} />
                  {item.title}
                </Link>
              )
            })}
          </div>

          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label={mobileMenu ? "Close menu" : "Open menu"}
            className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300"
          >
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div className="lg:hidden border-t border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 px-4 py-3 shadow-lg animate-slide-down">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.title}
                  to={item.path}
                  onClick={() => setMobileMenu(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800"
                  }`}
                >
                  <Icon size={18} />
                  {item.title}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}