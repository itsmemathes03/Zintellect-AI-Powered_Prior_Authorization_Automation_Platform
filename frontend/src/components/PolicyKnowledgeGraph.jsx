import {
  Network,
  Shield,
  FileText,
  ChevronRight
} from "lucide-react"

export default function PolicyKnowledgeGraph() {

  return (

    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">

      {/* HEADER */}

      <div className="flex items-center gap-4 mb-10">

        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">

          <Network className="text-indigo-800" size={32} />

        </div>

        <div>

          <h2 className="text-3xl font-bold text-blue-950">

            Policy Knowledge Graph
          </h2>

          <p className="text-slate-600 mt-2">

            Interactive visualization of insurance policies and their relationships
          </p>

        </div>

      </div>

      {/* GRAPH VISUALIZATION */}

      <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl p-8 mb-8 min-h-[400px] border border-slate-200 flex items-center justify-center">

        <svg className="w-full h-full max-h-96" viewBox="0 0 600 400">

          {/* NODES */}

          {/* MAIN POLICY NODE */}

          <circle cx="300" cy="200" r="40" fill="#1e40af" opacity="0.9" />

          <text

            x="300"

            y="210"

            textAnchor="middle"

            fill="white"

            fontSize="12"

            fontWeight="bold"
          >

            Insurance

          </text>

          <text

            x="300"

            y="223"

            textAnchor="middle"

            fill="white"

            fontSize="12"

            fontWeight="bold"
          >

            Policy
          </text>

          {/* CONNECTED NODES */}

          {/* COVERAGE NODE */}

          <circle cx="100" cy="100" r="35" fill="#0891b2" opacity="0.8" />

          <text

            x="100"

            y="108"

            textAnchor="middle"

            fill="white"

            fontSize="11"

            fontWeight="bold"
          >

            Coverage

          </text>

          <text

            x="100"

            y="120"

            textAnchor="middle"

            fill="white"

            fontSize="11"

            fontWeight="bold"
          >

            Services
          </text>

          {/* DIAGNOSIS NODE */}

          <circle cx="500" cy="100" r="35" fill="#0891b2" opacity="0.8" />

          <text

            x="500"

            y="108"

            textAnchor="middle"

            fill="white"

            fontSize="11"

            fontWeight="bold"
          >

            Eligible

          </text>

          <text

            x="500"

            y="120"

            textAnchor="middle"

            fill="white"

            fontSize="11"

            fontWeight="bold"
          >

            Diagnoses
          </text>

          {/* PROCEDURES NODE */}

          <circle cx="100" cy="300" r="35" fill="#0891b2" opacity="0.8" />

          <text

            x="100"

            y="308"

            textAnchor="middle"

            fill="white"

            fontSize="11"

            fontWeight="bold"
          >

            Procedure

          </text>

          <text

            x="100"

            y="320"

            textAnchor="middle"

            fill="white"

            fontSize="11"

            fontWeight="bold"
          >

            Codes
          </text>

          {/* REQUIREMENTS NODE */}

          <circle cx="500" cy="300" r="35" fill="#0891b2" opacity="0.8" />

          <text

            x="500"

            y="308"

            textAnchor="middle"

            fill="white"

            fontSize="11"

            fontWeight="bold"
          >

            Clinical

          </text>

          <text

            x="500"

            y="320"

            textAnchor="middle"

            fill="white"

            fontSize="11"

            fontWeight="bold"
          >

            Requirements
          </text>

          {/* CONNECTIONS */}

          <line

            x1="300"

            y1="200"

            x2="135"

            y2="125"

            stroke="#cbd5e1"

            strokeWidth="2"

            opacity="0.6"
          />

          <line

            x1="300"

            y1="200"

            x2="465"

            y2="125"

            stroke="#cbd5e1"

            strokeWidth="2"

            opacity="0.6"
          />

          <line

            x1="300"

            y1="200"

            x2="135"

            y2="275"

            stroke="#cbd5e1"

            strokeWidth="2"

            opacity="0.6"
          />

          <line

            x1="300"

            y1="200"

            x2="465"

            y2="275"

            stroke="#cbd5e1"

            strokeWidth="2"

            opacity="0.6"
          />

          {/* DIAGONAL CONNECTIONS */}

          <line

            x1="100"

            y1="135"

            x2="100"

            y2="265"

            stroke="#cbd5e1"

            strokeWidth="2"

            opacity="0.4"

            strokeDasharray="5,5"
          />

          <line

            x1="500"

            y1="135"

            x2="500"

            y2="265"

            stroke="#cbd5e1"

            strokeWidth="2"

            opacity="0.4"

            strokeDasharray="5,5"
          />

        </svg>

      </div>

      {/* LEGEND */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">

          <h3 className="font-bold text-blue-950 mb-4 flex items-center gap-2">

            <div className="w-4 h-4 rounded-full bg-blue-950"></div>

            Primary Node
          </h3>

          <p className="text-blue-900 text-sm">

            Insurance Policy - Central node containing all rules and constraints
          </p>

        </div>

        <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-5">

          <h3 className="font-bold text-cyan-950 mb-4 flex items-center gap-2">

            <div className="w-4 h-4 rounded-full bg-cyan-600"></div>

            Connected Nodes
          </h3>

          <p className="text-cyan-900 text-sm">

            Policy attributes linked through relationships and dependencies
          </p>

        </div>

      </div>

      {/* POLICY RELATIONSHIPS */}

      <div className="space-y-4">

        <h3 className="font-bold text-slate-900 text-lg">

          Policy Relationships & Dependencies
        </h3>

        {[

          {
            from: "Coverage Services",

            to: "Procedure Codes",

            relationship:
              "Defines which procedures are covered"
          },

          {
            from: "Eligible Diagnoses",

            to: "Clinical Requirements",

            relationship:
              "Specifies evidence needed for each diagnosis"
          },

          {
            from: "Clinical Requirements",

            to: "Procedure Codes",

            relationship:
              "Links symptoms to treatment options"
          },

          {
            from: "Coverage Services",

            to: "Clinical Requirements",

            relationship:
              "Sets thresholds for medical necessity"
          }
        ].map((link, idx) => (

          <div

            key={idx}

            className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all"
          >

            <div className="flex-1">

              <div className="flex items-center gap-2">

                <span className="font-semibold text-slate-900">

                  {link.from}
                </span>

                <ChevronRight size={20} className="text-slate-400" />

                <span className="font-semibold text-slate-900">

                  {link.to}
                </span>

              </div>

              <p className="text-sm text-slate-600 mt-2">

                {link.relationship}

              </p>

            </div>

            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">

              <Shield className="text-indigo-700" size={24} />

            </div>

          </div>
        ))}

      </div>

      {/* STATISTICS */}

      <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="text-center">

          <p className="text-3xl font-extrabold text-indigo-950">

            47
          </p>

          <p className="text-slate-600 text-sm mt-2">

            Policy Nodes
          </p>

        </div>

        <div className="text-center">

          <p className="text-3xl font-extrabold text-indigo-950">

            89
          </p>

          <p className="text-slate-600 text-sm mt-2">

            Relationships
          </p>

        </div>

        <div className="text-center">

          <p className="text-3xl font-extrabold text-indigo-950">

            156
          </p>

          <p className="text-slate-600 text-sm mt-2">

            Conditions
          </p>

        </div>

      </div>

    </div>
  )
}
