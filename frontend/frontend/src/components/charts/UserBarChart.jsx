import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

const BAR_COLORS = {
  Doctors: "#3b82f6",
  Providers: "#10b981",
  Patients: "#f59e0b",
  Admins: "#8b5cf6",
}

export default function UserBarChart({ data = [], height = 300, vertical = false }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No user data available
      </div>
    )
  }

  const chartData = data.map((item) => ({
    name: item.label || item.role || item.name,
    value: item.value || item.count || 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout={vertical ? "vertical" : "horizontal"}
        margin={{ top: 10, right: 10, left: vertical ? 60 : 0, bottom: vertical ? 0 : 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
        {vertical ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }} tickLine={false} axisLine={false} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
          </>
        )}
        <Tooltip
          contentStyle={{
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            backdropFilter: "blur(12px)",
            background: "rgba(255,255,255,0.9)",
          }}
          formatter={(value, name) => [value, "Count"]}
        />
        <Bar
          dataKey="value"
          radius={[8, 8, 0, 0]}
          animationBegin={0}
          animationDuration={1000}
          animationEasing="ease-out"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={BAR_COLORS[entry.name] || "#3b82f6"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
