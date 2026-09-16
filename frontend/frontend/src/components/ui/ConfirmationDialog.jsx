import { AlertTriangle } from "lucide-react"
import Modal from "./Modal"
import Button from "./Button"

export default function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${
          variant === "danger" ? "bg-danger-50 dark:bg-danger-500/10" :
          variant === "warning" ? "bg-warning-50 dark:bg-warning-500/10" :
          "bg-brand-50 dark:bg-brand-900/20"
        }`}>
          <AlertTriangle size={24} className={
            variant === "danger" ? "text-danger-600" :
            variant === "warning" ? "text-warning-600" :
            "text-brand-600"
          } />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={variant === "danger" ? "danger" : variant === "warning" ? "warning" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
