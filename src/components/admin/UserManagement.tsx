// src/components/admin/UserManagement.tsx
import React, { useState, useEffect, useMemo } from 'react'
import { useAdminUsers } from '../../hooks/useAdminUsers'
import { useToast } from '../../context/ToastContext'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { ConfirmModal } from '../common/Modal'
import { formatDate } from '../../utils/date-utils'
import { Search, UserX, UserCheck, Trash2, Eye, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../config/supabase'

export const UserManagement: React.FC = () => {
    const { showToast } = useToast()

    // State for filters
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'active' | 'suspended' | 'all'>('all')
    const [olympiadFilter, setOlympiadFilter] = useState<string>('all')
    const [olympiadOptions, setOlympiadOptions] = useState<string[]>([])
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [page, setPage] = useState(1)
    const limit = 20
    const [sortBy, setSortBy] = useState('created_at')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    // Modal state
    const [selectedUser, setSelectedUser] = useState<string | null>(null)
    const [confirmAction, setConfirmAction] = useState<'suspend' | 'activate' | 'delete' | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    // Memoize filter params to prevent unnecessary refetches
    const params = useMemo(() => ({
        search: search || undefined,
        status: statusFilter,
        olympiadId: olympiadFilter === 'all' ? null : olympiadFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
    }), [search, statusFilter, olympiadFilter, dateFrom, dateTo, page, limit, sortBy, sortOrder])

    const { users, total, loading, error, refetch, suspendUser, activateUser, deleteUser } = useAdminUsers(params)

    const totalPages = Math.ceil(total / limit)

    // Fetch olympiad options once
    useEffect(() => {
        const fetchOlympiads = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('olympiad_id')
                .not('olympiad_id', 'is', null)
                .limit(1000)
            if (!error && data) {
                const unique = [...new Set(data.map(u => u.olympiad_id))].filter(Boolean) as string[]
                setOlympiadOptions(unique)
            }
        }
        fetchOlympiads()
    }, [])

    // Handlers
    const handleAction = async (userId: string, action: typeof confirmAction) => {
        try {
            if (action === 'suspend') {
                await suspendUser(userId)
                showToast('کاربر تعلیق شد', 'success')
            } else if (action === 'activate') {
                await activateUser(userId)
                showToast('کاربر فعال شد', 'success')
            } else if (action === 'delete') {
                await deleteUser(userId)
                showToast('کاربر حذف شد', 'success')
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'خطا', 'error')
        } finally {
            setModalOpen(false)
            setSelectedUser(null)
            setConfirmAction(null)
        }
    }

    const openConfirm = (userId: string, action: typeof confirmAction) => {
        setSelectedUser(userId)
        setConfirmAction(action)
        setModalOpen(true)
    }

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage)
        }
    }

    // Reset to page 1 when filters change
    const handleFilterChange = (callback: () => void) => {
        setPage(1)
        callback()
    }

    return (
        <div className="p-5 md:p-8 max-w-7xl mx-auto" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">مدیریت کاربران</h1>
                    <p className="text-sm text-text-secondary mt-1">مدیریت و جستجوی کاربران سیستم</p>
                </div>
                <Button variant="secondary" onClick={() => refetch()} loading={loading} className="w-full md:w-auto">
                    <RefreshCw className="w-4 h-4" />
                    بروزرسانی
                </Button>
            </div>

            {/* Filters - Redesigned with larger fields */}
            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Search className="w-5 h-5 text-text-tertiary" />
                        </div>
                        <Input
                            type="text"
                            placeholder="جستجو بر اساس نام یا ایمیل..."
                            value={search}
                            onChange={(e) => handleFilterChange(() => setSearch(e.target.value))}
                            className="pr-12 py-3 text-base w-full rounded-xl border-border focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => handleFilterChange(() => setStatusFilter(e.target.value as any))}
                        className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-base w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="all">همه وضعیت‌ها</option>
                        <option value="active">فعال</option>
                        <option value="suspended">تعلیق شده</option>
                    </select>

                    {/* Olympiad Filter */}
                    <select
                        value={olympiadFilter}
                        onChange={(e) => handleFilterChange(() => setOlympiadFilter(e.target.value))}
                        className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-base w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="all">همه المپیادها</option>
                        {olympiadOptions.map(o => (
                            <option key={o} value={o}>{o}</option>
                        ))}
                    </select>

                    {/* Date Range */}
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => handleFilterChange(() => setDateFrom(e.target.value))}
                            className="w-full py-3 text-base rounded-xl border-border focus:ring-2 focus:ring-indigo-500"
                            placeholder="از تاریخ"
                        />
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => handleFilterChange(() => setDateTo(e.target.value))}
                            className="w-full py-3 text-base rounded-xl border-border focus:ring-2 focus:ring-indigo-500"
                            placeholder="تا تاریخ"
                        />
                    </div>
                </div>

                {/* Sorting & Pagination Info */}
                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border-subtle pt-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-text-secondary">مرتب‌سازی:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => handleFilterChange(() => setSortBy(e.target.value))}
                            className="rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="created_at">تاریخ عضویت</option>
                            <option value="name">نام</option>
                            <option value="email">ایمیل</option>
                            <option value="last_login">آخرین ورود</option>
                        </select>
                        <select
                            value={sortOrder}
                            onChange={(e) => handleFilterChange(() => setSortOrder(e.target.value as 'asc' | 'desc'))}
                            className="rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="desc">نزولی</option>
                            <option value="asc">صعودی</option>
                        </select>
                    </div>
                    <div className="mr-auto text-sm text-text-secondary">
                        نمایش <span className="font-medium text-text-secondary">{users.length}</span> از <span className="font-medium text-text-secondary">{total}</span> کاربر
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface-2/80 text-text-secondary border-b border-border">
                                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">نام</th>
                                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">ایمیل</th>
                                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">نقش</th>
                                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">وضعیت</th>
                                <th className="text-right py-3 px-4 font-medium whitespace-nowrap hidden md:table-cell">تاریخ عضویت</th>
                                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-text-tertiary">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                            در حال بارگذاری...
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-text-tertiary">
                                        <div className="flex flex-col items-center gap-2">
                                            <Filter className="w-8 h-8 text-text-tertiary" />
                                            <span>هیچ کاربری با این فیلترها یافت نشد</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b border-border-subtle hover:bg-surface-2/60 transition-colors">
                                        <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">{user.name}</td>
                                        <td className="py-3 px-4 text-text-secondary whitespace-nowrap">{user.email}</td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            {user.is_admin ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent-muted text-accent-hover">
                                                    ادمین
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-3 text-text-secondary">
                                                    کاربر
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            {user.status === 'suspended' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    تعلیق
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    فعال
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-text-secondary whitespace-nowrap text-xs hidden md:table-cell">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1">
                                                {user.status !== 'suspended' && (
                                                    <button
                                                        onClick={() => openConfirm(user.id, 'suspend')}
                                                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 hover:text-amber-800 transition"
                                                        title="تعلیق"
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {user.status === 'suspended' && (
                                                    <button
                                                        onClick={() => openConfirm(user.id, 'activate')}
                                                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-800 transition"
                                                        title="فعال کردن"
                                                    >
                                                        <UserCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openConfirm(user.id, 'delete')}
                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <Link
                                                    to={`/admin/users/${user.id}`}
                                                    className="p-1.5 rounded-lg text-text-tertiary hover:bg-surface-3 hover:text-text-secondary transition"
                                                    title="مشاهده پروفایل"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
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

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={() => {
                    if (selectedUser && confirmAction) {
                        handleAction(selectedUser, confirmAction)
                    }
                }}
                title={
                    confirmAction === 'suspend' ? 'تعلیق کاربر' :
                        confirmAction === 'activate' ? 'فعال‌سازی کاربر' :
                            'حذف کاربر'
                }
                message={
                    confirmAction === 'suspend' ? 'آیا از تعلیق این کاربر اطمینان دارید؟' :
                        confirmAction === 'activate' ? 'آیا از فعال‌سازی این کاربر اطمینان دارید؟' :
                            'این کاربر برای همیشه حذف خواهد شد. آیا اطمینان دارید؟'
                }
                confirmLabel={
                    confirmAction === 'suspend' ? 'تعلیق' :
                        confirmAction === 'activate' ? 'فعال‌سازی' :
                            'حذف'
                }
            />
        </div>
    )
}
