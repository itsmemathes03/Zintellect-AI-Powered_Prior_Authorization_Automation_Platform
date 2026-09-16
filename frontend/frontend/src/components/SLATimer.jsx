import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

export default function SLATimer({

  hoursRemaining = 48,
  totalHours

}) {

  // ==========================================
  // CALCULATE STATUS
  // ==========================================

  let status = "active"

  let statusColor = "text-blue-700"

  let bgColor = "bg-blue-100"

  let label = "Time Remaining"

  if (hoursRemaining <= 0) {

    status = "expired"

    statusColor = "text-red-700"

    bgColor = "bg-red-100"

    label = "SLA EXPIRED"

  } else if (hoursRemaining <= 6) {

    status = "critical"

    statusColor = "text-red-700"

    bgColor = "bg-red-100"

    label = "Critical - Due Soon"

  } else if (hoursRemaining <= 12) {

    status = "warning"

    statusColor = "text-orange-700"

    bgColor = "bg-orange-100"

    label = "Warning - Half Time Used"

  } else {

    status = "active"

    statusColor = "text-blue-700"

    bgColor = "bg-blue-100"

    label = "Time Remaining"

  }

  // ==========================================
  // CALCULATE PROGRESS
  // ==========================================

  const slaTotalHours = totalHours || 48

  const progress =

    ((slaTotalHours - hoursRemaining) /

    slaTotalHours) *

    100

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const days = Math.floor(hoursRemaining / 24)

  const remainingHours = hoursRemaining % 24

  const timeString =

    days > 0

      ? `${days}d ${remainingHours}h`

      : `${hoursRemaining}h`

  return (

    <div

      className={`border rounded-3xl p-8 ${bgColor} ${statusColor}`}
    >

      <div className="flex items-center justify-between mb-8">

        <div>

          <h3 className="text-2xl font-bold mb-2">

            Service Level Agreement (SLA) Timer
          </h3>

          <p className="text-sm opacity-90">

            Authorization request response deadline
          </p>

        </div>

        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">

          <Clock className="w-10 h-10" />

        </div>

      </div>

      {/* TIMER DISPLAY */}

      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">

        <div className="text-center">

          <p className="text-sm font-semibold opacity-80 mb-2">

            {label}
          </p>

          <p className="text-5xl font-extrabold font-mono">

            {timeString}
          </p>

          <p className="text-xs opacity-75 mt-3">

            Out of {slaTotalHours} hours

          </p>

        </div>

      </div>

      {/* PROGRESS BAR */}

      <div className="mb-6">

        <div className="flex items-center justify-between mb-3">

          <span className="text-sm font-semibold">

            SLA Progress
          </span>

          <span className="text-sm font-bold">

            {Math.round(progress)}%
          </span>

        </div>

        <div className="w-full h-3 rounded-full bg-white/30 overflow-hidden border border-white/40">

          <div
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 transition-all duration-1000"

            style={{

              width: `${progress}%`
            }}
          ></div>

        </div>

      </div>

      {/* STATUS INDICATOR */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">

          <p className="text-xs opacity-80 mb-2">

            Status
          </p>

          <p className="text-lg font-bold">

            {

              status === "expired"

                ? "EXPIRED"

                : status === "critical"

                ? "CRITICAL"

                : status === "warning"

                ? "WARNING"

                : "ACTIVE"
            }

          </p>

        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">

          <p className="text-xs opacity-80 mb-2">

            Time Used
          </p>

          <p className="text-lg font-bold">

            {Math.round(progress)}%
          </p>

        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">

          <p className="text-xs opacity-80 mb-2">

            Next Escalation
          </p>

          <p className="text-lg font-bold">

            {

              hoursRemaining <= 6

                ? "Immediate"

                : hoursRemaining <= 12

                ? "2 hours"

                : "6 hours"
            }

          </p>

        </div>

      </div>

      {/* RECOMMENDATIONS */}

      {

        status !== "active" && (

          <div

            className={`mt-6 pt-6 border-t border-white/20 ${

              status === "expired"

                ? "bg-red-50/30"

                : "bg-orange-50/30"
            } rounded-2xl p-5 border border-white/20`}
          >

            <div className="flex items-start gap-3">

              {

                status === "expired" ? (

                  <AlertTriangle

                    className="flex-shrink-0 mt-1"

                    size={20}
                  />

                ) : (

                  <AlertCircle

                    className="flex-shrink-0 mt-1"

                    size={20}
                  />
                )
              }

              <div className="flex-1">

                <p className="font-semibold mb-2">

                  {

                    status === "expired"

                      ? "Action Required"

                      : "Recommended Action"
                  }

                </p>

                <p className="text-sm leading-6">

                  {

                    status === "expired"

                      ? "This request has exceeded the SLA deadline. Immediate escalation to supervisor required."

                      : "Time is running short. Review request now and make a decision to avoid SLA violation."
                  }

                </p>

              </div>

            </div>

          </div>
        )
      }

    </div>
  )
}
