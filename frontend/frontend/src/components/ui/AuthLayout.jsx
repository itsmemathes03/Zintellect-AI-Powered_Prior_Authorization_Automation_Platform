import { Link } from "react-router-dom"
import { BrainCircuit, ShieldCheck, Lock } from "lucide-react"

export default function AuthLayout({ children, title, subtitle, icon: Icon, accentText, features, width = "md" }) {
  const widthClass = width === "lg" ? "max-w-xl" : "max-w-md"

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 lg:flex">
      <div className="relative hidden overflow-hidden bg-navy-950 lg:flex lg:w-[45%] lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl motion-reduce:hidden" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl motion-reduce:hidden" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700">
            <BrainCircuit size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-white">Zintellect AI</h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Prior Authorization</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-brand-400/20 bg-brand-400/10">
            <Icon size={26} className="text-brand-300" aria-hidden="true" />
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
            Secure care coordination
          </p>
          <h2 className="text-3xl font-bold leading-tight text-white">
            {title}
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-400">
            {subtitle}
          </p>

          {features && (
            <div className="mt-10 space-y-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <ShieldCheck size={14} className="text-teal-300" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{feature.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500">
          <Lock size={12} aria-hidden="true" />
          HIPAA-aware secure platform. All access is monitored.
        </div>
      </div>

      <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
        <div className={`w-full ${widthClass} animate-slide-up motion-reduce:animate-none`}>
          <div className="mb-10 flex items-center justify-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700">
              <BrainCircuit size={18} className="text-white" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Zintellect AI</h1>
          </div>

          <div className="mb-8 text-center">
            <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              <span className="h-px w-6 bg-slate-200 dark:bg-navy-800" />
              Secure sign-in
              <span className="h-px w-6 bg-slate-200 dark:bg-navy-800" />
            </div>
            <h2 className={`text-2xl font-bold text-slate-900 dark:text-white ${accentText || ""}`}>{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-elevated dark:border-navy-800 dark:bg-navy-900 sm:p-8">
            {children}
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:text-slate-400 dark:hover:text-brand-400"
            >
              &larr;&nbsp; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}