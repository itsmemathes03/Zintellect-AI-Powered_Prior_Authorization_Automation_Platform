import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

export default function RequestsLineChart({ data = [], height = 300, color = "#3b82f6", gradientId = "requestGradient" }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No time-series data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          tickFormatter={(val) => {
            const d = new Date(val)
            return `${d.getMonth() + 1}/${d.getDate()}`
          }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            backdropFilter: "blur(12px)",
            background: "rgba(255,255,255,0.9)",
          }}
          labelFormatter={(val) => `Date: ${val}`}
          formatter={(value) => [value, "Requests"]}
        />
        <Area type="monotone" dataKey="count" stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} animationDuration={1200} animationEasing="ease-out" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
