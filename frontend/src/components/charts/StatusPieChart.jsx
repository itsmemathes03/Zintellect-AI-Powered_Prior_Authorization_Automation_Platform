import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

const COLORS = {
  Approved: "#10b981",
  Rejected: "#ef4444",
  Pending: "#3b82f6",
  "Manual Review": "#f59e0b",
  Processing: "#8b5cf6",
}

const RADIAN = Math.PI / 180

function renderCustomizedLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.05) return null
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {(percent * 100).toFixed(0)}%
    </text>
  )
}

export default function StatusPieChart({ data = [], height = 300, showLabel = true }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No status data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={showLabel ? 60 : 0}
          outerRadius={100}
          paddingAngle={3}
          dataKey="count"
          nameKey="status"
          label={showLabel ? renderCustomizedLabel : undefined}
          animationBegin={0}
          animationDuration={1200}
          animationEasing="ease-out"
        >
          {data.map((entry) => (
            <Cell key={entry.status} fill={COLORS[entry.status] || "#94a3b8"} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            backdropFilter: "blur(12px)",
            background: "rgba(255,255,255,0.9)",
          }}
          formatter={(value, name) => [value, name]}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={10}
          formatter={(value) => <span className="text-sm font-medium text-slate-700">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
