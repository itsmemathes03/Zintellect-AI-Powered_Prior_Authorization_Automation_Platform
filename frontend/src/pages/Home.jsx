import {

  ShieldCheck,

  Stethoscope,

  UserRound,

  ArrowRight,

  BrainCircuit,

  FileText,

  Shield

} from "lucide-react"

import { Link } from "react-router-dom"

export default function Home() {

  return (

    <div className="min-h-screen bg-slate-100">

      {/* ========================================== */}
      {/* HERO SECTION */}
      {/* ========================================== */}

      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white">

        <div className="max-w-7xl mx-auto px-6 py-24">

          <div className="text-center">

            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 px-5 py-2 rounded-full mb-8">

              <BrainCircuit size={20} />

              <span className="text-sm font-medium">

                AI Powered Healthcare Workflow Automation

              </span>

            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">

              Zintellect AI

            </h1>

            <p className="mt-8 text-lg md:text-2xl text-blue-100 max-w-3xl mx-auto leading-9">

              Intelligent Prior Authorization Automation Platform
              for Healthcare Providers, Insurance Companies,
              and Patients.

            </p>

            {/* HERO BUTTONS */}

            <div className="flex flex-col md:flex-row items-center justify-center gap-5 mt-12">

              <Link to="/doctor-dashboard">

                <button className="bg-white text-blue-950 px-8 py-4 rounded-2xl font-semibold text-lg hover:scale-105 transition-all shadow-xl">

                  Start Authorization

                </button>

              </Link>

              <Link to="/provider-login">

                <button className="bg-blue-800 border border-blue-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-700 transition-all">

                  Insurance Portal

                </button>

              </Link>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* FEATURE SECTION */}
      {/* ========================================== */}

      <div className="max-w-7xl mx-auto px-6 py-20">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* FEATURE 1 */}

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">

            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">

              <BrainCircuit
                className="text-blue-800"
                size={32}
              />

            </div>

            <h3 className="text-2xl font-bold mt-6">

              AI Validation Engine

            </h3>

            <p className="text-gray-500 mt-4 leading-8">

              Automatically analyze healthcare documents,
              validate payer requirements,
              and generate intelligent authorization decisions.

            </p>

          </div>

          {/* FEATURE 2 */}

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">

            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">

              <FileText
                className="text-emerald-700"
                size={32}
              />

            </div>

            <h3 className="text-2xl font-bold mt-6">

              Smart Document Processing

            </h3>

            <p className="text-gray-500 mt-4 leading-8">

              Upload medical reports,
              clinical notes,
              imaging results,
              and automatically extract structured data.

            </p>

          </div>

          {/* FEATURE 3 */}

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">

            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">

              <Shield
                className="text-purple-700"
                size={32}
              />

            </div>

            <h3 className="text-2xl font-bold mt-6">

              Insurance Verification

            </h3>

            <p className="text-gray-500 mt-4 leading-8">

              Instantly verify insurance coverage,
              auto-fill member details,
              and accelerate healthcare approval workflows.

            </p>

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* ROLE CARDS */}
      {/* ========================================== */}

      <div className="max-w-7xl mx-auto px-6 pb-24">

        <div className="text-center mb-16">

          <h2 className="text-4xl font-bold text-slate-900">

            Unified Healthcare Ecosystem

          </h2>

          <p className="text-gray-500 text-lg mt-5">

            Streamline collaboration between
            providers, doctors, and patients.

          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* ========================================== */}
          {/* INSURANCE PROVIDER */}
          {/* ========================================== */}

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 hover:-translate-y-2 transition-all duration-300">

            <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center">

              <ShieldCheck
                className="text-blue-700"
                size={40}
              />

            </div>

            <h2 className="text-3xl font-bold mt-8 text-slate-900">

              Insurance Provider

            </h2>

            <p className="text-gray-500 mt-5 leading-8 text-lg">

              Manage healthcare policies,
              define authorization rules,
              monitor claims,
              and review AI-powered authorization decisions.

            </p>

            <ul className="mt-8 space-y-3 text-gray-600">

              <li>• Upload Insurance Policies</li>

              <li>• Manage Authorization Rules</li>

              <li>• Review Prior Authorization Requests</li>

              <li>• Monitor AI Decision Analytics</li>

            </ul>

            <Link to="/provider-login">

              <button className="w-full mt-10 bg-blue-900 text-white py-4 rounded-2xl font-semibold hover:bg-blue-800 transition-all flex items-center justify-center gap-3">

                Provider Portal

                <ArrowRight size={18} />

              </button>

            </Link>

          </div>

          {/* ========================================== */}
          {/* DOCTOR */}
          {/* ========================================== */}

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 hover:-translate-y-2 transition-all duration-300">

            <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center">

              <Stethoscope
                className="text-emerald-600"
                size={40}
              />

            </div>

            <h2 className="text-3xl font-bold mt-8 text-slate-900">

              Doctor

            </h2>

            <p className="text-gray-500 mt-5 leading-8 text-lg">

              Submit patient authorization requests,
              upload supporting clinical evidence,
              and track AI-generated approval decisions.

            </p>

            <ul className="mt-8 space-y-3 text-gray-600">

              <li>• Submit Prior Authorization Requests</li>

              <li>• Upload Clinical Documents</li>

              <li>• Auto-Fill Insurance Verification</li>

              <li>• Monitor Request Status</li>

            </ul>

            <Link to="/doctor-login">

              <button className="w-full mt-10 bg-emerald-600 text-white py-4 rounded-2xl font-semibold hover:bg-emerald-500 transition-all flex items-center justify-center gap-3">

                Doctor Portal

                <ArrowRight size={18} />

              </button>

            </Link>

          </div>

          {/* ========================================== */}
          {/* PATIENT */}
          {/* ========================================== */}

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 hover:-translate-y-2 transition-all duration-300">

            <div className="w-20 h-20 rounded-3xl bg-purple-100 flex items-center justify-center">

              <UserRound
                className="text-purple-600"
                size={40}
              />

            </div>

            <h2 className="text-3xl font-bold mt-8 text-slate-900">

              Patient

            </h2>

            <p className="text-gray-500 mt-5 leading-8 text-lg">

              Register healthcare insurance,
              receive secure insurance IDs by email,
              and track authorization workflows.

            </p>

            <ul className="mt-8 space-y-3 text-gray-600">

              <li>• Register Insurance Membership</li>

              <li>• Receive Insurance ID via Email</li>

              <li>• Track Authorization Status</li>

              <li>• Access Healthcare Coverage Details</li>

            </ul>

            <Link to="/patient-register">

              <button className="w-full mt-10 bg-purple-600 text-white py-4 rounded-2xl font-semibold hover:bg-purple-500 transition-all flex items-center justify-center gap-3">

                Patient Portal

                <ArrowRight size={18} />

              </button>

            </Link>

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* FOOTER */}
      {/* ========================================== */}

      <footer className="bg-slate-950 text-slate-300 py-10">

        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">

          <div>

            <h3 className="text-2xl font-bold text-white">

              Zintellect AI

            </h3>

            <p className="mt-2 text-slate-400">

              AI Powered Healthcare Authorization Platform

            </p>

          </div>

          <div className="text-sm text-slate-500">

            © 2026 Zintellect AI.
            All rights reserved.

          </div>

        </div>

      </footer>

    </div>
  )
}