import {

  Link,

  useLocation

} from "react-router-dom"

import {

  Menu,

  X,

  ShieldCheck,

  Stethoscope,

  UserRound,

  BrainCircuit,

  Home

} from "lucide-react"

import {

  useState

} from "react"

export default function Navbar() {

  // ==========================================
  // STATES
  // ==========================================

  const [mobileMenu, setMobileMenu] = useState(false)

  const location = useLocation()

  const isAdminLoggedIn = !!(
    localStorage.getItem("access_token") || localStorage.getItem("token")
  )

  // ==========================================
  // NAVIGATION ITEMS
  // ==========================================

  const navItems = [

    {
      title: "Home",

      path: "/",

      icon: Home
    },

    {
      title: "Doctor",

      path: "/doctor-dashboard",

      icon: Stethoscope
    },

    {
      title: "Provider",

      path: "/provider-login",

      icon: ShieldCheck
    },

    {
      title: "Patient",

      path: "/patient-register",

      icon: UserRound
    },

    {
      title: "Admin",

      path: isAdminLoggedIn ? "/admin-dashboard" : "/admin-login",

      icon: ShieldCheck
    }
  ]

  // ==========================================
  // ACTIVE LINK
  // ==========================================

  const isActive = (path) => {

    return location.pathname === path
  }

  return (

    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200 shadow-sm">

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <div className="flex items-center justify-between h-20">

          {/* ========================================== */}
          {/* LOGO */}
          {/* ========================================== */}

          <Link
            to="/"
            className="flex items-center gap-3 sm:gap-4"
          >

            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-r from-blue-950 to-indigo-800 flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300">

              <BrainCircuit
                className="text-white"
                size={28}
              />

            </div>

            <div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-blue-950">

                Zintellect AI

              </h1>

              <p className="text-[10px] sm:text-xs text-slate-500 tracking-wide">

                PRIOR AUTHORIZATION PLATFORM

              </p>

            </div>

          </Link>

          {/* ========================================== */}
          {/* DESKTOP NAVIGATION */}
          {/* ========================================== */}

          <div className="hidden lg:flex items-center gap-4">

            {

              navItems.map((item) => {

                const Icon = item.icon

                return (

                  <Link
                    key={item.title}
                    to={item.path}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 ${

                      isActive(item.path)

                        ? "bg-gradient-to-r from-blue-950 to-indigo-800 text-white shadow-xl"

                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >

                    <Icon size={20} />

                    {item.title}

                  </Link>
                )
              })
            }

          </div>

          {/* ========================================== */}
          {/* MOBILE MENU BUTTON */}
          {/* ========================================== */}

          <button

            onClick={() =>

              setMobileMenu(

                !mobileMenu
              )
            }

            className="lg:hidden w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shadow-md"
          >

            {

              mobileMenu ? (

                <X
                  className="text-slate-700"
                  size={28}
                />

              ) : (

                <Menu
                  className="text-slate-700"
                  size={28}
                />
              )
            }

          </button>

        </div>

      </div>

      {/* ========================================== */}
      {/* MOBILE MENU */}
      {/* ========================================== */}

      {

        mobileMenu && (

          <div className="lg:hidden border-t border-slate-200 bg-white px-6 py-6 shadow-2xl animate-in slide-in-from-top duration-300">

            <div className="space-y-4">

              {

                navItems.map((item) => {

                  const Icon = item.icon

                  return (

                    <Link
                      key={item.title}
                      to={item.path}
                      onClick={() =>

                        setMobileMenu(false)
                      }

                      className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold transition-all duration-300 ${

                        isActive(item.path)

                          ? "bg-gradient-to-r from-blue-950 to-indigo-800 text-white shadow-lg"

                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >

                      <Icon size={22} />

                      {item.title}

                    </Link>
                  )
                })
              }

            </div>

          </div>
        )
      }

    </nav>
  )
}