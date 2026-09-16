import { useState, useEffect } from "react"
import { Network, Shield, FileText, ChevronRight, Loader2, AlertCircle } from "lucide-react"
import axios from "axios"

const NODE_COLORS = {
  policy: "#1e40af",
  condition: "#0891b2",
  document: "#059669",
  provider: "#7c3aed",
  procedure: "#ea580c",
}

const NODE_LABELS = {
  policy: "Policy",
  condition: "Condition",
  document: "Document",
  provider: "Provider",
  procedure: "Procedure",
}

export default function PolicyKnowledgeGraph() {
  const [graph, setGraph] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchGraph() {
      try {
        const token = localStorage.getItem("access_token")
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/policy-graph`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setGraph(res.data)
      } catch (e) {
        setError(e.response?.data?.detail || "Failed to load policy graph")
      } finally {
        setLoading(false)
      }
    }
    fetchGraph()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 mt-4 font-medium">Loading policy knowledge graph...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 flex flex-col items-center justify-center min-h-[500px]">
        <AlertCircle className="text-red-500" size={40} />
        <p className="text-red-600 mt-4 font-medium">{error}</p>
      </div>
    )
  }

  const nodes = graph?.nodes || []
  const edges = graph?.edges || []
  const stats = graph?.stats || { total_policies: 0, total_conditions: 0, total_documents: 0, total_providers: 0, total_relationships: 0 }

  const policyNodes = nodes.filter((n) => n.type === "policy")
  const conditionNodes = nodes.filter((n) => n.type === "condition")
  const documentNodes = nodes.filter((n) => n.type === "document")
  const providerNodes = nodes.filter((n) => n.type === "provider")
  const procedureNodes = nodes.filter((n) => n.type === "procedure")

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
          <Network className="text-indigo-800" size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-blue-950">Policy Knowledge Graph</h2>
          <p className="text-slate-600 mt-2">
            Interactive visualization of insurance policies and their relationships
          </p>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Policies", value: stats.total_policies, color: "bg-blue-50 text-blue-900" },
          { label: "Providers", value: stats.total_providers, color: "bg-violet-50 text-violet-900" },
          { label: "Procedures", value: procedureNodes.length, color: "bg-orange-50 text-orange-900" },
          { label: "Conditions", value: stats.total_conditions, color: "bg-cyan-50 text-cyan-900" },
          { label: "Documents", value: stats.total_documents, color: "bg-emerald-50 text-emerald-900" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-4 text-center ${s.color} border border-slate-100`}>
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* POLICY NODES LIST */}
      {policyNodes.length > 0 && (
        <div className="mb-8">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Policies by Provider</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {policyNodes.map((node) => {
              const policyEdges = edges.filter((e) => e.source === node.id)
              return (
                <div
                  key={node.id}
                  className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="text-blue-700" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{node.label}</p>
                    <p className="text-xs text-slate-500">{node.provider}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    node.status === "approved" ? "bg-green-100 text-green-700" :
                    node.status === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {node.status}
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Links</p>
                    <p className="font-bold text-slate-900">{policyEdges.length}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* RELATIONSHIPS */}
      {edges.length > 0 && (
        <div className="space-y-3 mb-8">
          <h3 className="font-bold text-slate-900 text-lg">
            Policy Relationships & Dependencies
          </h3>
          {edges.slice(0, 20).map((edge, idx) => {
            const sourceNode = nodes.find((n) => n.id === edge.source)
            const targetNode = nodes.find((n) => n.id === edge.target)
            if (!sourceNode || !targetNode) return null
            return (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {sourceNode.label}
                    </span>
                    <ChevronRight size={16} className="text-slate-400" />
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      edge.relationship === "requires_condition"
                        ? "bg-cyan-100 text-cyan-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {targetNode.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    {edge.relationship === "requires_condition"
                      ? "Requires clinical condition evidence"
                      : "Requires supporting documentation"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: NODE_COLORS[targetNode.type] + "20" }}>
                  {targetNode.type === "document" ? (
                    <FileText size={18} style={{ color: NODE_COLORS[targetNode.type] }} />
                  ) : (
                    <Shield size={18} style={{ color: NODE_COLORS[targetNode.type] }} />
                  )}
                </div>
              </div>
            )
          })}
          {edges.length > 20 && (
            <p className="text-center text-sm text-slate-400 mt-4">
              Showing 20 of {edges.length} relationships
            </p>
          )}
        </div>
      )}

      {nodes.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Network size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-medium">No policy data available</p>
          <p className="text-sm mt-1">Upload insurance policies to build the knowledge graph</p>
        </div>
      )}
    </div>
  )
}
