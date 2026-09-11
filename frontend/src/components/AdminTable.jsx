import { useState } from "react"
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Loader } from "lucide-react"

export default function AdminTable({
  columns,
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onSort,
  sortField,
  sortDirection,
  searchPlaceholder = "Search...",
  emptyMessage = "No data found",
  renderRow,
}) {
  const [searchInput, setSearchInput] = useState("")

  const handleSearch = (val) => {
    setSearchInput(val)
    const timeout = setTimeout(() => {
      onSearch?.(val)
    }, 400)
    return () => clearTimeout(timeout)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-4">
      {/* Search */}
      {onSearch && (
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              const timeout = setTimeout(() => onSearch(e.target.value), 400)
              return () => clearTimeout(timeout)
            }}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-4 text-left font-semibold text-slate-700 dark:text-slate-300 ${
                    col.sortable ? "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none" : ""
                  }`}
                  onClick={() => {
                    if (col.sortable && onSort) {
                      const newDir = sortField === col.key && sortDirection === "asc" ? "desc" : "asc"
                      onSort(col.key, newDir)
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && sortField === col.key && (
                      sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <Loader className="animate-spin mx-auto text-blue-600" size={32} />
                  <p className="mt-3 text-slate-500">Loading...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <p className="text-slate-500">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((item, i) => (
                <tr
                  key={item.id || i}
                  className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {renderRow ? (
                    renderRow(item)
                  ) : (
                    columns.map((col) => (
                      <td key={col.key} className="px-4 py-4 text-slate-700 dark:text-slate-300">
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm bg-white dark:bg-slate-800 dark:border-slate-700"
            >
              {[10, 20, 50, 100].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span>of {total} results</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                    page === pageNum
                      ? "bg-blue-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
