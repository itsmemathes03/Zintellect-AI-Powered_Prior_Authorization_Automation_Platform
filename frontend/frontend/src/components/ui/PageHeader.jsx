import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

export default function PageHeader({ title, description, icon: Icon, breadcrumbs = [], actions, className = "" }) {
  return (
    <div className={`mb-6 ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-3">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />}
              {crumb.path ? (
                <Link to={crumb.path} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-900 dark:text-white font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center ring-1 ring-brand-600/10">
              <Icon size={20} className="text-brand-600 dark:text-brand-400" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
