import {

  CheckCircle2,

  Loader2,

  Brain,

  ShieldCheck,

  FileText,

  Activity,

  Sparkles,

  ClipboardCheck,

  Lock,

  Database,

  AlertCircle,

  Zap

} from "lucide-react"

const stages = [

  {
    title: "Multimodal OCR Processing",

    description:
      "Scanning and digitizing uploaded healthcare documents",

    icon: FileText,

    color: "text-blue-700",

    bg: "bg-blue-100"
  },

  {
    title: "PHI De-identification",

    description:
      "Removing personally identifiable health information",

    icon: Lock,

    color: "text-purple-700",

    bg: "bg-purple-100"
  },

  {
    title: "Document Classification",

    description:
      "Categorizing documents by type and clinical relevance",

    icon: ClipboardCheck,

    color: "text-cyan-700",

    bg: "bg-cyan-100"
  },

  {
    title: "Hierarchical Chunking",

    description:
      "Breaking documents into structured semantic units",

    icon: Database,

    color: "text-green-700",

    bg: "bg-green-100"
  },

  {
    title: "Vector Embedding Generation",

    description:
      "Converting text chunks into AI-readable embeddings",

    icon: Sparkles,

    color: "text-orange-700",

    bg: "bg-orange-100"
  },

  {
    title: "Hybrid Retrieval",

    description:
      "Combining keyword and semantic search techniques",

    icon: Brain,

    color: "text-indigo-700",

    bg: "bg-indigo-100"
  },

  {
    title: "Hierarchical RAG Retrieval",

    description:
      "Intelligent context retrieval from policy databases",

    icon: Activity,

    color: "text-rose-700",

    bg: "bg-rose-100"
  },

  {
    title: "Medical NER Extraction",

    description:
      "Extracting medical entities (diagnoses, procedures, medications)",

    icon: AlertCircle,

    color: "text-yellow-700",

    bg: "bg-yellow-100"
  },

  {
    title: "Policy Rule Matching",

    description:
      "Matching clinical evidence against insurance policies",

    icon: ShieldCheck,

    color: "text-emerald-700",

    bg: "bg-emerald-100"
  },

  {
    title: "Weighted Risk Scoring",

    description:
      "Computing authorization likelihood based on evidence",

    icon: Zap,

    color: "text-red-700",

    bg: "bg-red-100"
  },

  {
    title: "Explainable AI Generation",

    description:
      "Creating human-readable reasoning traces for decisions",

    icon: Brain,

    color: "text-teal-700",

    bg: "bg-teal-100"
  },

  {
    title: "Provider Validation",

    description:
      "Final review and approval by insurance provider",

    icon: CheckCircle2,

    color: "text-lime-700",

    bg: "bg-lime-100"
  }
]

export default function ProcessingTracker({

  currentStage

}) {

  // ==========================================
  // CURRENT INDEX
  // ==========================================

  const currentIndex = stages.findIndex(

    (stage) =>

      stage.title === currentStage
  )

  // ==========================================
  // PROGRESS
  // ==========================================

  const progress =

    ((currentIndex + 1) / stages.length) * 100

  return (

    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 overflow-hidden">

      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">

        {/* LEFT */}

        <div>

          <div className="flex items-center gap-4">

            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">

              <Brain
                className="text-blue-800"
                size={32}
              />

            </div>

            <div>

              <h2 className="text-3xl font-bold text-slate-900">

                HMH-RAGES AI Pipeline

              </h2>

              <p className="text-gray-500 mt-2">

                Real-time healthcare authorization workflow (12-stage process)

              </p>

            </div>

          </div>

        </div>

        {/* RIGHT STATUS */}

        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-5">

          <p className="text-sm text-blue-700 font-semibold">

            Current AI Stage

          </p>

          <h3 className="text-xl font-bold text-blue-950 mt-2">

            {

              currentStage ||

              "Initializing Workflow"
            }

          </h3>

        </div>

      </div>

      {/* ========================================== */}
      {/* PROGRESS BAR */}
      {/* ========================================== */}

      <div className="mb-12">

        <div className="flex items-center justify-between mb-4">

          <p className="text-sm font-semibold text-slate-600">

            AI Workflow Progress

          </p>

          <p className="text-sm font-bold text-blue-900">

            {Math.round(progress)}%

          </p>

        </div>

        <div className="w-full bg-slate-200 rounded-full h-5 overflow-hidden">

          <div
            className="bg-gradient-to-r from-blue-900 via-cyan-500 to-emerald-500 h-5 rounded-full transition-all duration-1000"
            style={{

              width: `${progress}%`
            }}
          />

        </div>

      </div>

      {/* ========================================== */}
      {/* TIMELINE */}
      {/* ========================================== */}

      <div className="space-y-6">

        {

          stages.map((stage, index) => {

            const completed =

              currentIndex > index

            const active =

              currentIndex === index

            const Icon =
              stage.icon

            return (

              <div
                key={stage.title}
                className={`relative rounded-3xl border transition-all duration-500 overflow-hidden ${

                  completed

                    ? "bg-emerald-50 border-emerald-200"

                    : active

                    ? "bg-blue-50 border-blue-200 shadow-xl scale-[1.01]"

                    : "bg-slate-50 border-slate-200"
                }`}
              >

                {/* ACTIVE GLOW */}

                {

                  active && (

                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100/30 to-cyan-100/30 animate-pulse"></div>
                  )
                }

                <div className="relative p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                  {/* LEFT */}

                  <div className="flex items-start gap-5">

                    {/* ICON */}

                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${

                      completed

                        ? "bg-emerald-100"

                        : active

                        ? "bg-blue-100"

                        : stage.bg
                    }`}>

                      {

                        completed ? (

                          <CheckCircle2
                            className="text-emerald-600"
                            size={30}
                          />

                        ) : active ? (

                          <Loader2
                            className="text-blue-700 animate-spin"
                            size={30}
                          />

                        ) : (

                          <Icon
                            className={stage.color}
                            size={30}
                          />
                        )
                      }

                    </div>

                    {/* TEXT */}

                    <div>

                      <h3 className={`text-2xl font-bold ${

                        completed

                          ? "text-emerald-700"

                          : active

                          ? "text-blue-950"

                          : "text-slate-700"
                      }`}>

                        {index + 1}. {stage.title}

                      </h3>

                      <p className="text-gray-500 mt-3 leading-7 max-w-2xl">

                        {stage.description}

                      </p>

                    </div>

                  </div>

                  {/* RIGHT STATUS */}

                  <div>

                    {

                      completed ? (

                        <div className="bg-emerald-100 text-emerald-700 px-6 py-3 rounded-full font-semibold text-sm">

                          Completed

                        </div>

                      ) : active ? (

                        <div className="bg-blue-100 text-blue-700 px-6 py-3 rounded-full font-semibold text-sm animate-pulse">

                          Processing...

                        </div>

                      ) : (

                        <div className="bg-slate-200 text-slate-600 px-6 py-3 rounded-full font-semibold text-sm">

                          Pending

                        </div>
                      )
                    }

                  </div>

                </div>

              </div>
            )
          })
        }

      </div>

      {/* ========================================== */}
      {/* FOOTER AI NOTICE */}
      {/* ========================================== */}

      <div className="mt-10 bg-gradient-to-r from-blue-950 to-indigo-900 rounded-3xl p-8 text-white">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <h3 className="text-2xl font-bold">

              AI Clinical Decision Engine

            </h3>

            <p className="text-blue-100 mt-3 leading-8 max-w-3xl">

              Zintellect AI is analyzing clinical evidence,
              validating payer requirements,
              and generating an intelligent authorization recommendation.

            </p>

          </div>

          {/* LIVE INDICATOR */}

          <div className="flex items-center gap-4 bg-white/10 border border-white/20 rounded-2xl px-6 py-4">

            <div className="w-4 h-4 rounded-full bg-emerald-400 animate-pulse"></div>

            <span className="font-semibold text-lg">

              AI Workflow Active

            </span>

          </div>

        </div>

      </div>

    </div>
  )
}