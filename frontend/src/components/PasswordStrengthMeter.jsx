export default function PasswordStrengthMeter({ password }) {
  if (!password) return null

  const checks = [
    { label: "At least 6 characters", pass: password.length >= 6 },
    { label: "Contains uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", pass: /[a-z]/.test(password) },
    { label: "Contains number", pass: /\d/.test(password) },
    { label: "Contains special character", pass: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]

  const passed = checks.filter((c) => c.pass).length
  const strength = passed === 0 ? 0 : passed === 1 ? 1 : passed <= 3 ? 2 : passed <= 4 ? 3 : 4
  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"]
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-emerald-500"]

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= strength ? colors[strength] : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${strength <= 1 ? "text-red-600" : strength <= 2 ? "text-orange-600" : "text-emerald-600"}`}>
        {labels[strength]}
      </p>
      <ul className="space-y-1">
        {checks.map((check, i) => (
          <li key={i} className={`text-xs flex items-center gap-2 ${check.pass ? "text-emerald-600" : "text-slate-400"}`}>
            <span>{check.pass ? "\u2713" : "\u2022"}</span>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
