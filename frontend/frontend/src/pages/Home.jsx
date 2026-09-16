import { motion } from "framer-motion"
import {
  ShieldCheck,
  Stethoscope,
  UserRound,
  ArrowRight,
  BrainCircuit,
  FileText,
  Shield,
  CheckCircle2,
  Activity,
  Sparkles,
} from "lucide-react"
import { Link } from "react-router-dom"

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}
const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
}
const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
}

export default function Home() {

  return (

    <div className="min-h-screen bg-slate-50">
      {/* HERO SECTION */}
      <div className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-28 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-2.5 rounded-full mb-8">
              <BrainCircuit size={18} />
              <span className="text-sm font-medium">AI Powered Healthcare Workflow Automation</span>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold leading-tight">Zintellect AI</motion.h1>
            <motion.p variants={fadeInUp} className="mt-8 text-lg md:text-2xl text-blue-100 max-w-3xl mx-auto leading-9">
              Intelligent Prior Authorization Automation Platform for Healthcare Providers, Insurance Companies, and Patients.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col md:flex-row items-center justify-center gap-5 mt-12">
              <Link to="/doctor-dashboard">
                <button className="bg-white text-blue-950 px-8 py-4 rounded-2xl font-semibold text-lg hover:scale-105 transition-all shadow-xl flex items-center gap-3">
                  <Stethoscope size={20} /> Start Authorization
                </button>
              </Link>
              <Link to="/provider-login">
                <button className="bg-blue-800/50 backdrop-blur-xl border border-white/20 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-700/50 transition-all flex items-center gap-3">
                  <ShieldCheck size={20} /> Insurance Portal
                </button>
              </Link>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: FileText, label: "Smart Document Processing", value: "OCR + RAG", color: "text-cyan-300" },
              { icon: BrainCircuit, label: "Explainable Decisions", value: "AI Reasoning", color: "text-emerald-300" },
              { icon: Shield, label: "Privacy First", value: "PHI Protected", color: "text-blue-300" },
              { icon: Activity, label: "Real-time Status", value: "Live Tracking", color: "text-purple-300" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-5 text-center hover:bg-white/15 transition-all">
                <stat.icon size={24} className={`${stat.color} mx-auto mb-3`} />
                <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                <p className="text-blue-200 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-16">
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full mb-6">
            <Sparkles size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Core Capabilities</span>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-slate-900">Built for Healthcare</motion.h2>
          <motion.p variants={fadeInUp} className="text-slate-500 text-lg mt-4 max-w-2xl mx-auto">End-to-end AI-powered prior authorization automation</motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-8">          {[
            { icon: BrainCircuit, title: "AI Validation Engine", desc: "Automatically analyze healthcare documents, validate payer requirements, and generate intelligent authorization decisions.", bg: "bg-blue-50", iconColor: "text-blue-700" },
            { icon: FileText, title: "Smart Document Processing", desc: "Upload medical reports, clinical notes, imaging results, and automatically extract structured data with OCR.", bg: "bg-emerald-50", iconColor: "text-emerald-700" },
            { icon: Shield, title: "Insurance Verification", desc: "Instantly verify insurance coverage, auto-fill member details, and accelerate healthcare approval workflows.", bg: "bg-purple-50", iconColor: "text-purple-700" },
          ].map((feature, i) => (
            <motion.div key={i} variants={scaleIn} className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center`}>
                <feature.icon className={feature.iconColor} size={32} />
              </div>
              <h3 className="text-2xl font-bold mt-6 text-slate-900">{feature.title}</h3>
              <p className="text-gray-500 mt-4 leading-7">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ROLE CARDS */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-16">
          <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-slate-900">Unified Healthcare Ecosystem</motion.h2>
          <motion.p variants={fadeInUp} className="text-gray-500 text-lg mt-5">Streamline collaboration between providers, doctors, and patients.</motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* ========================================== */}
          {/* INSURANCE PROVIDER */}
          {/* ========================================== */}

          <motion.div variants={scaleIn} className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">

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

              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-500" /> Upload Insurance Policies</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-500" /> Manage Authorization Rules</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-500" /> Review Prior Authorization Requests</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-500" /> Monitor AI Decision Analytics</li>
            </ul>
            <Link to="/provider-login">
              <button className="w-full mt-10 bg-gradient-to-r from-blue-700 to-indigo-600 text-white py-4 rounded-2xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                Provider Portal
                <ArrowRight size={18} />
              </button>
            </Link>
          </motion.div>

          {/* ========================================== */}
          {/* DOCTOR */}
          {/* ========================================== */}

          <motion.div variants={scaleIn} className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">

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

              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Submit Prior Authorization Requests</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Upload Clinical Documents</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Auto-Fill Insurance Verification</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Monitor Request Status</li>
            </ul>
            <Link to="/doctor-login">
              <button className="w-full mt-10 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-4 rounded-2xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                Doctor Portal
                <ArrowRight size={18} />
              </button>
            </Link>
          </motion.div>

          {/* ========================================== */}
          {/* PATIENT */}
          {/* ========================================== */}

          <motion.div variants={scaleIn} className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">

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

              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-rose-500" /> Register Insurance Membership</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-rose-500" /> Receive Insurance ID via Email</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-rose-500" /> Track Authorization Status</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-rose-500" /> Access Healthcare Coverage Details</li>
            </ul>
            <Link to="/patient-register">
              <button className="w-full mt-10 bg-gradient-to-r from-rose-600 to-pink-500 text-white py-4 rounded-2xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                Patient Portal
                <ArrowRight size={18} />
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* FOOTER */}

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