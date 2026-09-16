export default function DataTable({ columns, data, loading, emptyMessage = "No data available", onRowClick, className = "" }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 dark:bg-navy-900 dark:border-navy-800 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-100 dark:bg-navy-800 border-b border-slate-200 dark:border-navy-800" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 border-b border-slate-100 dark:border-navy-800 last:border-0 flex items-center px-6 gap-4">
              {columns.map((_, j) => (
                <div key={j} className="h-4 bg-slate-200 dark:bg-navy-800 rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 dark:bg-navy-900 dark:border-navy-800 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-800/50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider ${col.className || ""}`}
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-slate-100 dark:border-navy-800 last:border-0 transition-colors duration-100 ${
                    onRowClick ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-800/50" : ""
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3 text-slate-900 dark:text-slate-200 ${col.cellClassName || ""}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
