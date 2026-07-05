// src/components/admin/ActivityLog.tsx
import React from 'react'
import { useActivityLogs } from '../../hooks/useActivityLogs'
import { formatDate } from '../../utils/date-utils'
import { RefreshCw, User } from 'lucide-react'
import { Button } from '../common/Button'

export const ActivityLog: React.FC = () => {
    const { logs, loading, error, refetch } = useActivityLogs(200)

    return (
        <div className="p-5 md:p-8 max-w-6xl mx-auto" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">لاگ فعالیت‌ها</h1>
                <Button variant="secondary" onClick={() => refetch()} loading={loading}>
                    <RefreshCw className="w-4 h-4" />
                    بروزرسانی
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-x-auto min-w-full">
                {loading && logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">در حال بارگذاری...</div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">هیچ لاگی یافت نشد</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 whitespace-nowrap">
                                <th className="text-right py-3 px-4 font-medium">کاربر</th>
                                <th className="text-right py-3 px-4 font-medium">اقدام</th>
                                <th className="text-right py-3 px-4 font-medium">جزئیات</th>
                                <th className="text-right py-3 px-4 font-medium">زمان</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium text-gray-800">{log.users?.name || 'ناشناس'}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{log.action}</td>
                                    <td className="py-3 px-4 text-gray-600">
                                        <div className="max-h-20 overflow-y-auto text-[11px] font-mono scrollbar-hide max-w-sm whitespace-pre-wrap bg-gray-50 p-2 rounded-lg border border-gray-100">
                                            {log.details ? JSON.stringify(log.details, null, 2) : '—'}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap text-xs">
                                        {formatDate(log.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}