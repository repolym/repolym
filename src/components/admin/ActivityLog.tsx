import React, { useState, useEffect, useMemo } from 'react'
import { useActivityLogs } from '../../hooks/useActivityLogs'
import { formatDate } from '../../utils/date-utils'
import { RefreshCw, User, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'

const PAGE_SIZE = 50

export const ActivityLog: React.FC = () => {
    const [page, setPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Fetch all logs (we'll filter client-side for search since we need to paginate)
    const { logs, loading, error, refetch } = useActivityLogs(1000)

    // Filter logs based on search
    const filteredLogs = useMemo(() => {
        if (!debouncedSearch.trim()) return logs
        const q = debouncedSearch.trim().toLowerCase()
        return logs.filter(log =>
            (log.users?.name?.toLowerCase() || '').includes(q) ||
            (log.users?.email?.toLowerCase() || '').includes(q) ||
            log.action.toLowerCase().includes(q)
        )
    }, [logs, debouncedSearch])

    const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE)
    const paginatedLogs = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return filteredLogs.slice(start, start + PAGE_SIZE)
    }, [filteredLogs, page])

    // Reset page when search changes
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch])

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage)
        }
    }

    // Safely render details with sanitization
    const renderDetails = (details: Record<string, unknown> | null) => {
        if (!details) return '—'
        // Remove sensitive keys before displaying
        const safeDetails = { ...details }
        const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'authorization', 'auth']
        for (const key of sensitiveKeys) {
            if (key in safeDetails) {
                safeDetails[key] = '[REDACTED]'
            }
        }
        return JSON.stringify(safeDetails, null, 2)
    }

    return (
        <div className="p-5 md:p-8 max-w-6xl mx-auto" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">لاگ فعالیت‌ها</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        {filteredLogs.length} رویداد · نمایش {paginatedLogs.length} مورد
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <Input
                            type="text"
                            placeholder="جستجو در نام، ایمیل یا اقدام..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10 w-56"
                        />
                    </div>
                    <Button variant="secondary" onClick={() => refetch()} loading={loading}>
                        <RefreshCw className="w-4 h-4" />
                        بروزرسانی
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">
                    {error}
                </div>
            )}

            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle overflow-x-auto min-w-full">
                {loading && logs.length === 0 ? (
                    <div className="text-center py-8 text-text-tertiary">در حال بارگذاری...</div>
                ) : paginatedLogs.length === 0 ? (
                    <div className="text-center py-8 text-text-tertiary">هیچ لاگی با این فیلترها یافت نشد</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface-2 text-text-secondary border-b border-border whitespace-nowrap">
                                <th className="text-right py-3 px-4 font-medium">کاربر</th>
                                <th className="text-right py-3 px-4 font-medium">اقدام</th>
                                <th className="text-right py-3 px-4 font-medium">جزئیات</th>
                                <th className="text-right py-3 px-4 font-medium">زمان</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLogs.map((log) => (
                                <tr key={log.id} className="border-b border-border-subtle hover:bg-surface-2 transition-colors">
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-text-tertiary" />
                                            <span className="font-medium text-text-primary">{log.users?.name || 'ناشناس'}</span>
                                        </div>
                                        {log.users?.email && (
                                            <div className="text-xs text-text-tertiary">{log.users.email}</div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap">{log.action}</td>
                                    <td className="py-3 px-4 text-text-secondary">
                                        <div className="max-h-20 overflow-y-auto text-[11px] font-mono scrollbar-hide max-w-sm whitespace-pre-wrap bg-surface-2 p-2 rounded-lg border border-border-subtle">
                                            {renderDetails(log.details)}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap text-xs">
                                        {formatDate(log.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-text-secondary">
                        صفحه {page} از {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <ChevronRight className="w-4 h-4" />
                            قبلی
                        </button>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            بعدی
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}