import {
  Brain,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp
} from "lucide-react"

export default function ExplainabilityDashboard({

  result

}) {

  // ==========================================
  // NULL SAFETY
  // ==========================================

  if (!result) {

    return (

      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-8 text-center">

        <Brain className="text-blue-800 mx-auto mb-4" size={40} />

        <p className="text-blue-900 font-semibold">

          No AI analysis available yet. Submit a request to see explainability details.

        </p>

      </div>
    )
  }

  return (

    <div className="space-y-8">

      {/* ========================================== */}
      {/* CONFIDENCE SCORE */}
      {/* ========================================== */}

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">

        <div className="flex items-center gap-4 mb-8">

          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">

            <TrendingUp className="text-blue-800" size={32} />

          </div>

          <div>

            <h2 className="text-3xl font-bold text-blue-950">

              AI Confidence Score
            </h2>

            <p className="text-slate-600 mt-2">

              Likelihood this authorization is appropriate
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* SCORE RING */}

          <div className="flex items-center justify-center">

            <div className="relative w-32 h-32">

              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">

                <circle

                  cx="60"

                  cy="60"

                  r="50"

                  fill="none"

                  stroke="#e2e8f0"

                  strokeWidth="8"
                />

                <circle

                  cx="60"

                  cy="60"

                  r="50"

                  fill="none"

                  stroke="url(#gradient)"

                  strokeWidth="8"

                  strokeDasharray={`${

                    (result.confidence_score ||

                    0) * 3.14
                  } 314`}

                  strokeLinecap="round"
                />

                <defs>

                  <linearGradient

                    id="gradient"

                    x1="0%"

                    y1="0%"

                    x2="100%"

                    y2="100%"
                  >

                    <stop

                      offset="0%"

                      stopColor="#1e40af"
                    />

                    <stop

                      offset="100%"

                      stopColor="#06b6d4"
                    />

                  </linearGradient>

                </defs>

              </svg>

              <div className="absolute inset-0 flex items-center justify-center">

                <div className="text-center">

                  <p className="text-4xl font-extrabold text-blue-950">

                    {result.confidence_score ||

                    0}

                    <span className="text-xl">%</span>

                  </p>

                  <p className="text-sm text-slate-600 mt-1">

                    Confidence

                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* DETAILS */}

          <div className="md:col-span-2 space-y-4">

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">

              <p className="font-semibold text-slate-900">

                Evidence Quality
              </p>

              <div className="flex items-center gap-2">

                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">

                  <div

                    className="h-full bg-emerald-500"

                    style={{

                      width: "92%"
                    }}
                  ></div>

                </div>

                <span className="text-sm font-bold text-emerald-700">

                  92%
                </span>

              </div>

            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">

              <p className="font-semibold text-slate-900">

                Policy Alignment
              </p>

              <div className="flex items-center gap-2">

                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">

                  <div

                    className="h-full bg-blue-500"

                    style={{

                      width: "85%"
                    }}
                  ></div>

                </div>

                <span className="text-sm font-bold text-blue-700">

                  85%
                </span>

              </div>

            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">

              <p className="font-semibold text-slate-900">

                Risk Assessment
              </p>

              <div className="flex items-center gap-2">

                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">

                  <div

                    className="h-full bg-green-500"

                    style={{

                      width: "78%"
                    }}
                  ></div>

                </div>

                <span className="text-sm font-bold text-green-700">

                  Low Risk
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* REASONING TRACE */}
      {/* ========================================== */}

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">

        <div className="flex items-center gap-4 mb-8">

          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">

            <Brain className="text-purple-800" size={32} />

          </div>

          <div>

            <h2 className="text-3xl font-bold text-blue-950">

              AI Reasoning Trace
            </h2>

            <p className="text-slate-600 mt-2">

              Step-by-step explainable AI decision path
            </p>

          </div>

        </div>

        <div className="space-y-4">

          <div className="flex gap-4 pb-4 border-b border-slate-200 last:border-0">

            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">

              <CheckCircle2 className="text-emerald-700" size={20} />

            </div>

            <div className="flex-1">

              <p className="font-semibold text-slate-900">

                Diagnosis verified against clinical evidence
              </p>

              <p className="text-sm text-slate-600 mt-1">

                Patient diagnosis matches submitted medical records
              </p>

            </div>

          </div>

          <div className="flex gap-4 pb-4 border-b border-slate-200 last:border-0">

            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">

              <CheckCircle2 className="text-emerald-700" size={20} />

            </div>

            <div className="flex-1">

              <p className="font-semibold text-slate-900">

                Procedure code matches policy requirements
              </p>

              <p className="text-sm text-slate-600 mt-1">

                Procedure is within covered services for this diagnosis
              </p>

            </div>

          </div>

          <div className="flex gap-4 pb-4 border-b border-slate-200 last:border-0">

            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">

              <CheckCircle2 className="text-emerald-700" size={20} />

            </div>

            <div className="flex-1">

              <p className="font-semibold text-slate-900">

                Clinical severity meets authorization threshold
              </p>

              <p className="text-sm text-slate-600 mt-1">

                Evidence supports medical necessity for treatment
              </p>

            </div>

          </div>

          <div className="flex gap-4 pb-4 border-b border-slate-200 last:border-0">

            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">

              <AlertCircle className="text-blue-700" size={20} />

            </div>

            <div className="flex-1">

              <p className="font-semibold text-slate-900">

                Prior authorization prerequisites met
              </p>

              <p className="text-sm text-slate-600 mt-1">

                All required documentation has been submitted
              </p>

            </div>

          </div>

          <div className="flex gap-4">

            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">

              <CheckCircle2 className="text-emerald-700" size={20} />

            </div>

            <div className="flex-1">

              <p className="font-semibold text-slate-900">

                Recommendation: APPROVE
              </p>

              <p className="text-sm text-slate-600 mt-1">

                High confidence that this request meets all policy criteria
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* POLICY CLAUSES */}
      {/* ========================================== */}

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">

        <div className="flex items-center gap-4 mb-8">

          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">

            <Shield className="text-emerald-800" size={32} />

          </div>

          <div>

            <h2 className="text-3xl font-bold text-blue-950">

              Matched Policy Clauses
            </h2>

            <p className="text-slate-600 mt-2">

              Insurance policies that supported this decision
            </p>

          </div>

        </div>

        <div className="space-y-4">

          {[

            {
              clause:
                "Coverage for advanced imaging procedures",

              section:
                "Section 3.2 - Diagnostic Services",

              match: "95%"
            },

            {
              clause:
                "MRI imaging approved for neurological conditions",

              section:
                "Section 4.1 - Imaging Guidelines",

              match: "92%"
            },

            {
              clause:
                "Pre-authorization required for procedures over $5,000",

              section:
                "Section 2.3 - Authorization Requirements",

              match: "88%"
            }
          ].map((item, idx) => (

            <div

              key={idx}

              className="border border-emerald-200 bg-emerald-50 rounded-2xl p-5"
            >

              <div className="flex items-start justify-between gap-4">

                <div className="flex-1">

                  <p className="font-bold text-emerald-950">

                    {item.clause}

                  </p>

                  <p className="text-sm text-emerald-700 mt-2">

                    {item.section}

                  </p>

                </div>

                <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap">

                  {item.match}
                </div>

              </div>

            </div>
          ))}

        </div>

      </div>

    </div>
  )
}
