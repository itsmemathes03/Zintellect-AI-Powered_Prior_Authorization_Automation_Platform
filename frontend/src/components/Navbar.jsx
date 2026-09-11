import { Link, useLocation } from "react-router-dom"
import { useState } from "react"
import {
  Menu,
  X,
  ShieldCheck,
  Stethoscope,
  UserRound,
  BrainCircuit,
  Home,
  Sun,
  Moon,
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()
  const { darkMode, toggleTheme } = useTheme()

  const isAdminLoggedIn = !!(
    localStorage.getItem("access_token") || localStorage.getItem("token")
  )

  const navItems = [
    { title: "Home", path: "/", icon: Home },
    { title: "Doctor", path: "/doctor-dashboard", icon: Stethoscope },
    { title: "Provider", path: "/provider-login", icon: ShieldCheck },
    { title: "Patient", path: "/patient-register", icon: UserRound },
    { title: "Admin", path: isAdminLoggedIn ? "/admin-dashboard" : "/admin-login", icon: ShieldCheck },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-r from-blue-950 to-indigo-800 flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300">
              <BrainCircuit className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-blue-950 dark:text-white">
                Zintellect AI
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 tracking-wide">
                PRIOR AUTHORIZATION PLATFORM
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* DESKTOP NAVIGATION */}
            <div className="hidden lg:flex items-center gap-4">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.title}
                    to={item.path}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 ${
                      isActive(item.path)
                        ? "bg-gradient-to-r from-blue-950 to-indigo-800 text-white shadow-xl"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={20} />
                    {item.title}
                  </Link>
                )
              })}
            </div>

            {/* THEME TOGGLE */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300"
            >
              {darkMode ? (
                <Sun className="text-amber-400" size={24} />
              ) : (
                <Moon className="text-slate-700" size={24} />
              )}
            </button>

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-md"
            >
              {mobileMenu ? (
                <X className="text-slate-700 dark:text-slate-200" size={28} />
              ) : (
                <Menu className="text-slate-700 dark:text-slate-200" size={28} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-6 shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="space-y-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.title}
                  to={item.path}
                  onClick={() => setMobileMenu(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                    isActive(item.path)
                      ? "bg-gradient-to-r from-blue-950 to-indigo-800 text-white shadow-lg"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon size={22} />
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