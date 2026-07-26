import React, { useState, useMemo, useEffect } from 'react'
import { useAdminUsers } from '../../hooks/useAdminUsers'
import { useToast } from '../../context/ToastContext'
import { Button } from '../common/Button'
import { ConfirmModal } from '../common/Modal'
import { formatDate } from '../../utils/date-utils'
import { RefreshCw, UserPlus, UserMinus, Search } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { Input } from '../common/Input'

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value)
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])
    return debounced
}

export const AdminManagement: React.FC = () => {
    const { showToast } = useToast()
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearch = useDebounce(searchQuery, 300)
    const [page, setPage] = useState(1)
    const limit = 10

    // Fetch admins
    const adminParams = useMemo(() => ({
        isAdmin: true,
        search: debouncedSearch || undefined,
        page,
        limit,
        sortBy: 'created_at',
        sortOrder: 'desc' as const,
    }), [debouncedSearch, page])

    // Fetch non-admins for promotion
    const nonAdminParams = useMemo(() => ({
        isAdmin: false,
        search: debouncedSearch || undefined,
        page: 1,
        limit: 20,
        sortBy: 'created_at',
        sortOrder: 'desc' as const,
    }), [debouncedSearch])

    const { users: admins, total: totalAdmins, loading, error, refetch } = useAdminUsers(adminParams)
    const { users: nonAdmins, loading: loadingNonAdmins, refetch: refetchNonAdmins } = useAdminUsers(nonAdminParams)

    const [modalOpen, setModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [modalAction, setModalAction] = useState<'promote' | 'demote' | null>(null)
    const [processing, setProcessing] = useState(false)

    const totalPages = Math.ceil(totalAdmins / limit)

    const handleAction = async (userId: string, action: 'promote' | 'demote') => {
        setProcessing(true)
        try {
            if (action === 'promote') {
                await adminService.makeAdmin(userId)
                showToast('کاربر به ادمین ارتقا یافت', 'success')
            } else {
                // Check if this is the last admin
                if (admins.length <= 1) {
                    showToast('نمی‌توان آخرین ادمین سیستم را حذف کرد', 'error')
                    setModalOpen(false)
                    setSelectedUserId(null)
                    setModalAction(null)
                    setProcessing(false)
                    return
                }
                await adminService.removeAdmin(userId)
                showToast('دسترسی ادمین لغو شد', 'success')
            }
            await refetch()
            await refetchNonAdmins()
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'خطا', 'error')
        } finally {
            setProcessing(false)
            setModalOpen(false)
            setSelectedUserId(null)
            setModalAction(null)
        }
    }

    const openConfirm = (userId: string, action: 'promote' | 'demote') => {
        setSelectedUserId(userId)
        setModalAction(action)
        setModalOpen(true)
    }

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage)
        }
    }

    return (
        <div className="p-5 md:p-8 max-w-6xl mx-auto" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">مدیریت ادمین‌ها</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        {totalAdmins} ادمین · {nonAdmins.length} کاربر قابل ارتقا
                    </p>
                </div>
                <Button variant="secondary" onClick={() => { refetch(); refetchNonAdmins(); }} loading={loading}>
                    <RefreshCw className="w-4 h-4" />
                    بروزرسانی
                </Button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <Input
                        type="text"
                        placeholder="جستجو در نام یا ایمیل..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="pr-10"
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">
                    {error}
                </div>
            )}

            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-6 mb-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-accent" />
                    ارتقا به ادمین
                </h2>
                {loadingNonAdmins ? (
                    <div className="text-center py-4 text-text-tertiary">در حال بارگذاری...</div>
                ) : nonAdmins.length === 0 ? (
                    <p className="text-text-tertiary text-sm">همه کاربران ادمین هستند یا کاربری یافت نشد.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {nonAdmins.slice(0, 10).map((u) => (
                            <div key={u.id} className="flex items-center justify-between p-3 bg-surface-2 rounded-xl border border-border-subtle">
                                <span className="text-sm font-medium text-text-secondary truncate ml-2" title={u.name}>{u.name}</span>
                                <Button variant="primary" size="sm" onClick={() => openConfirm(u.id, 'promote')} className="shrink-0">
                                    <UserPlus className="w-4 h-4" />
                                    ارتقا
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle overflow-x-auto min-w-full">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-surface-2 text-text-secondary border-b border-border whitespace-nowrap">
                            <th className="text-right py-3 px-4 font-medium">نام</th>
                            <th className="text-right py-3 px-4 font-medium">ایمیل</th>
                            <th className="text-right py-3 px-4 font-medium">تاریخ عضویت</th>
                            <th className="text-right py-3 px-4 font-medium">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && admins.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-8 text-text-tertiary">در حال بارگذاری...</td></tr>
                        ) : admins.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-8 text-text-tertiary">هیچ ادمینی یافت نشد</td></tr>
                        ) : (
                            admins.map((admin) => (
                                <tr key={admin.id} className="border-b border-border-subtle hover:bg-surface-2 transition-colors">
                                    <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">{admin.name}</td>
                                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap">{admin.email}</td>
                                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap text-xs">{formatDate(admin.created_at)}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <button
                                            onClick={() => openConfirm(admin.id, 'demote')}
                                            className={`p-1.5 rounded-lg transition ${admins.length <= 1
                                                ? 'text-text-tertiary cursor-not-allowed opacity-50'
                                                : 'text-amber-600 hover:bg-amber-50 hover:text-amber-800'
                                                }`}
                                            title={admins.length <= 1 ? 'آخرین ادمین قابل حذف نیست' : 'لغو دسترسی ادمین'}
                                            disabled={admins.length <= 1}
                                        >
                                            <UserMinus className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
                        <span className="text-sm text-text-secondary">
                            صفحه {page} از {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                className="px-3 py-1 rounded-lg border border-border hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                قبلی
                            </button>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages}
                                className="px-3 py-1 rounded-lg border border-border hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                بعدی
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={() => {
                    if (selectedUserId && modalAction) {
                        handleAction(selectedUserId, modalAction)
                    }
                }}
                title={modalAction === 'promote' ? 'ارتقا به ادمین' : 'لغو دسترسی ادمین'}
                message={
                    modalAction === 'promote'
                        ? 'آیا از ارتقا این کاربر به ادمین اطمینان دارید؟'
                        : 'آیا از لغو دسترسی ادمین این کاربر اطمینان دارید؟'
                }
                confirmLabel={modalAction === 'promote' ? 'ارتقا' : 'لغو دسترسی'}
                loading={processing}
            />
        </div>
    )
}