import {
  AlertCircle,
  AlertTriangle,
  Zap
} from "lucide-react"

export default function UrgencyIndicator({

  urgencyLevel = "medium"

}) {

  // ==========================================
  // URGENCY CONFIGURATION
  // ==========================================

  const urgencyConfig = {

    critical: {

      label: "Critical",

      color: "bg-red-100 text-red-700 border-red-300",

      bgGradient:
        "from-red-600 to-red-700",

      icon: Zap,

      description:
        "Immediate attention required - patient condition is severe"
    },

    high: {

      label: "High",

      color: "bg-orange-100 text-orange-700 border-orange-300",

      bgGradient:
        "from-orange-600 to-orange-700",

      icon: AlertTriangle,

      description:
        "Urgent action needed - potential health risk"
    },

    medium: {

      label: "Medium",

      color: "bg-yellow-100 text-yellow-700 border-yellow-300",

      bgGradient:
        "from-yellow-600 to-yellow-700",

      icon: AlertCircle,

      description:
        "Standard priority - regular processing timeline"
    },

    low: {

      label: "Low",

      color: "bg-green-100 text-green-700 border-green-300",

      bgGradient:
        "from-green-600 to-green-700",

      icon: AlertCircle,

      description:
        "Routine case - can be scheduled normally"
    }
  }

  const config = urgencyConfig[urgencyLevel] || urgencyConfig.medium

  const Icon = config.icon

  return (

    <div className={`border rounded-3xl p-8 ${config.color}`}>

      <div className="flex items-start gap-6">

        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${config.bgGradient} flex items-center justify-center flex-shrink-0 shadow-xl`}>

          <Icon
            className="text-white"
            size={40}
          />

        </div>

        <div className="flex-1">

          <div className="flex items-center gap-3 mb-2">

            <h3 className="text-2xl font-extrabold">

              Urgency Level: {config.label}

            </h3>

            <div className="px-4 py-2 rounded-full bg-white/30 backdrop-blur-sm text-sm font-bold">

              {urgencyLevel.toUpperCase()}

            </div>

          </div>

          <p className="leading-7 text-base mt-2">

            {config.description}

          </p>

          {/* URGENCY INDICATORS */}

          <div className="flex items-center gap-3 mt-5 pt-5 border-t border-current border-opacity-30">

            <div className="flex items-center gap-2">

              <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>

              <span className="text-sm font-medium">

                Processing Speed: {

                  urgencyLevel === "critical"

                    ? "Immediate"

                    : urgencyLevel === "high"

                    ? "Express (30 min)"

                    : urgencyLevel === "medium"

                    ? "Standard (2-4 hours)"

                    : "Routine (24 hours)"
                }

              </span>

            </div>

            <span className="mx-2 opacity-50">•</span>

            <div className="flex items-center gap-2">

              <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>

              <span className="text-sm font-medium">

                Priority Queue: {

                  urgencyLevel === "critical"

                    ? "Position 1"

                    : urgencyLevel === "high"

                    ? "Top 10"

                    : "Standard"
                }

              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
