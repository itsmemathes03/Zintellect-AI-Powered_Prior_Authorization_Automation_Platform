import {
  CheckCircle2,
  Clock,
  User,
  FileText,
  Shield,
  Zap,
  Eye,
  CheckSquare
} from "lucide-react"

const timelineEvents = [

  {
    id: 1,

    stage: "Request Submitted",

    timestamp: "2026-06-20 09:15 AM",

    user: "Dr. John Smith",

    description:
      "Prior authorization request submitted for MRI Brain scan",

    icon: FileText,

    color: "bg-blue-100 text-blue-700"
  },

  {
    id: 2,

    stage: "OCR Processing Completed",

    timestamp: "2026-06-20 09:18 AM",

    user: "AI System",

    description:
      "Medical documents scanned and digitized successfully",

    icon: Zap,

    color: "bg-purple-100 text-purple-700"
  },

  {
    id: 3,

    stage: "NER Extraction Completed",

    timestamp: "2026-06-20 09:22 AM",

    user: "AI System",

    description:
      "Extracted medical entities: Diagnosis, Procedure Code, Patient Info",

    icon: FileText,

    color: "bg-cyan-100 text-cyan-700"
  },

  {
    id: 4,

    stage: "Policy Retrieval Complete",

    timestamp: "2026-06-20 09:25 AM",

    user: "AI System",

    description:
      "Retrieved 3 matching insurance policy clauses from knowledge base",

    icon: Shield,

    color: "bg-emerald-100 text-emerald-700"
  },

  {
    id: 5,

    stage: "Risk Scoring Complete",

    timestamp: "2026-06-20 09:27 AM",

    user: "AI System",

    description:
      "Generated risk assessment: 78% approval likelihood",

    icon: Eye,

    color: "bg-orange-100 text-orange-700"
  },

  {
    id: 6,

    stage: "AI Recommendation Generated",

    timestamp: "2026-06-20 09:28 AM",

    user: "AI System",

    description:
      "AI decision: APPROVED with 96% confidence score",

    icon: CheckCircle2,

    color: "bg-green-100 text-green-700"
  },

  {
    id: 7,

    stage: "Provider Review Started",

    timestamp: "2026-06-20 09:30 AM",

    user: "Insurance Provider",

    description:
      "Request forwarded to medical reviewer for final validation",

    icon: User,

    color: "bg-indigo-100 text-indigo-700"
  },

  {
    id: 8,

    stage: "Final Decision Made",

    timestamp: "2026-06-20 09:35 AM",

    user: "Insurance Reviewer",

    description:
      "Request APPROVED - Authorized for MRI procedure",

    icon: CheckSquare,

    color: "bg-lime-100 text-lime-700"
  }
]

export default function AuditTrailTimeline() {

  return (

    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">

      {/* HEADER */}

      <div className="flex items-center gap-4 mb-10">

        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">

          <Clock className="text-blue-800" size={32} />

        </div>

        <div>

          <h2 className="text-3xl font-bold text-blue-950">

            Audit Trail Timeline
          </h2>

          <p className="text-slate-600 mt-2">

            Complete request processing history with timestamps and actors
          </p>

        </div>

      </div>

      {/* TIMELINE */}

      <div className="relative">

        {/* VERTICAL LINE */}

        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-emerald-200 to-green-200"></div>

        {/* EVENTS */}

        <div className="space-y-8">

          {

            timelineEvents.map((event, index) => (

              <div

                key={event.id}

                className="relative pl-32"
              >

                {/* DOT */}

                <div className={`absolute left-0 w-16 h-16 rounded-full ${event.color} flex items-center justify-center border-4 border-white shadow-lg`}>

                  <event.icon size={24} />

                </div>

                {/* CONTENT */}

                <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all">

                  <div className="flex items-start justify-between gap-4 mb-3">

                    <div>

                      <h3 className="text-xl font-bold text-slate-900">

                        {event.stage}

                      </h3>

                      <p className="text-sm text-slate-600 mt-1">

                        {event.user}
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-sm font-bold text-blue-950">

                        {event.timestamp}

                      </p>

                    </div>

                  </div>

                  <p className="text-slate-700 leading-relaxed">

                    {event.description}

                  </p>

                  {/* PROGRESS */}

                  <div className="mt-4 pt-4 border-t border-slate-200">

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">

                      <div
                        className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full"

                        style={{

                          width: `${

                            ((index + 1) /

                            timelineEvents.length) *

                            100
                          }%`
                        }}
                      ></div>

                    </div>

                    <p className="text-xs text-slate-600 mt-2">

                      Step {index + 1} of {timelineEvents.length}
                    </p>

                  </div>

                </div>

              </div>
            ))
          }

        </div>

      </div>

      {/* FOOTER STATS */}

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-200">

        <div className="text-center">

          <p className="text-3xl font-extrabold text-blue-950">

            {timelineEvents.length}
          </p>

          <p className="text-slate-600 text-sm mt-2">

            Total Steps
          </p>

        </div>

        <div className="text-center">

          <p className="text-3xl font-extrabold text-emerald-950">

            20 min
          </p>

          <p className="text-slate-600 text-sm mt-2">

            Total Duration
          </p>

        </div>

        <div className="text-center">

          <p className="text-3xl font-extrabold text-purple-950">

            8
          </p>

          <p className="text-slate-600 text-sm mt-2">

            Actors Involved
          </p>

        </div>

      </div>

    </div>
  )
}
