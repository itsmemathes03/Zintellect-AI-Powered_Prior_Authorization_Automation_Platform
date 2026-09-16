import { useEffect, useRef } from "react"
import { getAdminEvents } from "../services/api"
import { useToast } from "./Toast"

export default function AdminNotifications({ lastTimestamp, onNewTimestamp }) {
  const { addToast } = useToast()
  const intervalRef = useRef(null)

  useEffect(() => {
    // Poll every 30 seconds for new events
    // Future enhancement: replace with WebSocket for real-time updates
    const poll = async () => {
      try {
        const params = {}
        if (lastTimestamp) params.since = lastTimestamp
        const res = await getAdminEvents(params)
        const events = res.data.events || []
        if (events.length > 0) {
          events.forEach((event) => {
            const messages = {
              USER_CREATED: "New user created",
              USER_UPDATED: "User profile updated",
              USER_DEACTIVATED: "User deactivated",
              POLICY_STATUS_CHANGED: "Policy status changed",
            }
            const msg = messages[event.action] || event.description || event.action
            addToast(msg, "info", 5000)
          })
          // Update the latest timestamp for next poll
          const latest = events[0].timestamp
          if (latest && onNewTimestamp) {
            onNewTimestamp(latest)
          }
        }
      } catch {
        // Silently fail - polling is best-effort
      }
    }

    intervalRef.current = setInterval(poll, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [lastTimestamp, addToast, onNewTimestamp])

  return null
}
