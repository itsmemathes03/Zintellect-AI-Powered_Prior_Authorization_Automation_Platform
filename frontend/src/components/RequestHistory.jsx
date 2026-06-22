import { useEffect, useState } from "react"

import axios from "axios"

import { useNavigate } from "react-router-dom"

import {

  History,

  ShieldCheck,

  Clock3,

  CheckCircle2,

  Activity,

  Brain,

  ArrowRight

} from "lucide-react"

export default function RequestHistory() {

  const [requests, setRequests] = useState([])

  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  // ==========================================
  // LOAD REQUESTS
  // ==========================================

  useEffect(() => {

    async function loadRequests() {

      try {

        const response = await axios.get(

          `${import.meta.env.VITE_API_URL}/all-requests`
        )

        setRequests(

          response.data.requests || []
        )

      } catch (error) {

        console.log(error)
      }

      setLoading(false)
    }

    loadRequests()

  }, [])

  // ==========================================
  // STATUS COLORS
  // ==========================================

  const getStatusColor = (status) => {

    if (status === "Approved") {

      return "bg-emerald-100 text-emerald-700 border border-emerald-200"
    }

    if (

      status ===
      "Pending Additional Information"

    ) {

      return "bg-yellow-100 text-yellow-700 border border-yellow-200"
    }

    if (status === "Rejected") {

      return "bg-red-100 text-red-700 border border-red-200"
    }

    return "bg-blue-100 text-blue-700 border border-blue-200"
  }

  // ==========================================
  // LOADING UI
  // ==========================================

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">

        <div className="text-center">

          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-900 rounded-full animate-spin mx-auto mb-6"></div>

          <h1 className="text-3xl font-bold text-blue-950">

            Loading Request History...

          </h1>

          <p className="text-slate-500 mt-3">

            Fetching AI authorization records

          </p>

        </div>

      </div>
    )
  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 overflow-hidden relative">

      {/* BACKGROUND EFFECTS */}

      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

      {/* HERO */}

      <div className="relative bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 overflow-hidden">

        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">

            {/* LEFT */}

            <div>

              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-3 rounded-full mb-8 animate-pulse">

                <History
                  size={18}
                  className="text-cyan-300"
                />

                <span className="text-white font-medium">

                  AI Authorization Tracking

                </span>

              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-extrabold text-white leading-tight">

                Request

                <span className="block text-cyan-300 mt-2">

                  History

                </span>

              </h1>

              <p className="text-blue-100 text-lg md:text-xl mt-8 leading-9 max-w-3xl">

                Track all healthcare prior authorization
                workflows, AI clinical validations,
                and insurance approval decisions.

              </p>

              {/* BUTTON */}

              <button

                onClick={() =>

                  navigate("/doctor-dashboard")
                }

                className="mt-10 flex items-center gap-3 bg-white text-blue-950 px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all duration-300 shadow-2xl"
              >

                Go To Doctor Dashboard

                <ArrowRight size={22} />

              </button>

            </div>

            {/* RIGHT STATS */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 shadow-2xl hover:scale-105 transition-all duration-300">

                <ShieldCheck
                  className="text-emerald-300"
                  size={42}
                />

                <h2 className="text-6xl font-extrabold text-white mt-6">

                  98%

                </h2>

                <p className="text-blue-100 mt-4 text-lg">

                  Approval Accuracy

                </p>

              </div>

              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 shadow-2xl hover:scale-105 transition-all duration-300">

                <Brain
                  className="text-cyan-300"
                  size={42}
                />

                <h2 className="text-6xl font-extrabold text-white mt-6">

                  AI

                </h2>

                <p className="text-blue-100 mt-4 text-lg">

                  Clinical Analysis

                </p>

              </div>

              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 shadow-2xl hover:scale-105 transition-all duration-300">

                <Clock3
                  className="text-orange-300"
                  size={42}
                />

                <h2 className="text-6xl font-extrabold text-white mt-6">

                  2.1s

                </h2>

                <p className="text-blue-100 mt-4 text-lg">

                  AI Processing

                </p>

              </div>

              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 shadow-2xl hover:scale-105 transition-all duration-300">

                <Activity
                  className="text-purple-300"
                  size={42}
                />

                <h2 className="text-6xl font-extrabold text-white mt-6">

                  24/7

                </h2>

                <p className="text-blue-100 mt-4 text-lg">

                  Workflow Engine

                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* MAIN CONTENT */}

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">

        {/* EMPTY */}

        {

          requests.length === 0 ? (

            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/30 p-16 text-center">

              <div className="w-28 h-28 bg-blue-100 rounded-full flex items-center justify-center mx-auto">

                <History
                  size={52}
                  className="text-blue-900"
                />

              </div>

              <h2 className="text-4xl font-bold text-blue-950 mt-8">

                No Requests Found

              </h2>

              <p className="text-slate-500 mt-5 text-lg">

                Submitted authorization requests
                will appear here.

              </p>

            </div>

          ) : (

            <div className="space-y-8">

              {

                requests.map((request) => (

                  <div
                    key={request.request_id}
                    className="bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/30 p-6 md:p-8 hover:scale-[1.01] transition-all duration-300 overflow-hidden"
                  >

                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">

                      {/* LEFT CONTENT */}

                      <div className="flex-1">

                        {/* TOP */}

                        <div className="flex flex-col sm:flex-row sm:items-center gap-5">

                          {/* ICON */}

                          <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center shrink-0">

                            <CheckCircle2
                              className="text-blue-900"
                              size={40}
                            />

                          </div>

                          {/* TITLE */}

                          <div className="min-w-0">

                            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 break-words">

                              {request.patient_name}

                            </h2>

                            <p className="text-slate-500 mt-2 text-base md:text-lg">

                              Prior Authorization Request

                            </p>

                          </div>

                        </div>

                        {/* DETAILS */}

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-10">

                          {/* PROVIDER */}

                          <div>

                            <p className="text-slate-400 text-sm uppercase tracking-wide">

                              Insurance Provider

                            </p>

                            <h3 className="text-xl font-bold text-slate-900 mt-3 break-words">

                              {request.insurance_provider}

                            </h3>

                          </div>

                          {/* PROCEDURE */}

                          <div>

                            <p className="text-slate-400 text-sm uppercase tracking-wide">

                              Procedure Code

                            </p>

                            <h3 className="text-xl font-bold text-slate-900 mt-3 break-words">

                              {

                                request.procedure_code ||

                                request.procedure ||

                                "N/A"
                              }

                            </h3>

                          </div>

                          {/* REQUEST ID */}

                          <div className="xl:col-span-1 md:col-span-2">

                            <p className="text-slate-400 text-sm uppercase tracking-wide">

                              Request ID

                            </p>

                            <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-3 break-all leading-9">

                              {request.request_id}

                            </h3>

                          </div>

                        </div>

                      </div>

                      {/* STATUS */}

                      <div className="flex xl:block justify-start xl:justify-end shrink-0">

                        <span
                          className={`inline-flex items-center justify-center px-6 py-4 rounded-2xl font-bold text-lg text-center min-w-[180px] shadow-lg ${

                            getStatusColor(
                              request.status
                            )
                          }`}
                        >

                          {request.status}

                        </span>

                      </div>

                    </div>

                  </div>
                ))
              }

            </div>
          )
        }

      </div>

    </div>
  )
}