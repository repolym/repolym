// src/components/admin/UserManagement.tsx
import React, { useState } from 'react'
import { useAdminUsers } from '../../hooks/useAdminUsers'
import { useToast } from '../../context/ToastContext'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { ConfirmModal } from '../common/Modal'
import { formatDate } from '../../utils/date-utils'
import { Search, UserX, UserCheck, Trash2, Eye, RefreshCw } from 'lucide-react'

export const UserManagement: React.FC = () => {
    const { showToast } = useToast()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'active' | 'suspended' | 'all'>('all')
    const [selectedUser, setSelectedUser] = useState<string | null>(null)
    const [confirmAction, setConfirmAction] = useState<'suspend' | 'activate' | 'delete' | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    const { users, loading, error, refetch, suspendUser, activateUser, deleteUser } = useAdminUsers({
        search: search || undefined,
        status: statusFilter,
    })

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

    return (
        <div className="p-5 md:p-8 max-w-6xl mx-auto" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">مدیریت کاربران</h1>
                <Button variant="secondary" onClick={() => refetch()} loading={loading}>
                    <RefreshCw className="w-4 h-4" />
                    بروزرسانی
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="جستجو بر اساس نام یا ایمیل..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm w-36"
                    >
                        <option value="all">همه کاربران</option>
                        <option value="active">فعال</option>
                        <option value="suspended">تعلیق شده</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                            <th className="text-right py-3 px-4">نام</th>
                            <th className="text-right py-3 px-4">ایمیل</th>
                            <th className="text-right py-3 px-4">نقش</th>
                            <th className="text-right py-3 px-4">وضعیت</th>
                            <th className="text-right py-3 px-4">تاریخ عضویت</th>
                            <th className="text-right py-3 px-4">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && users.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">در حال بارگذاری...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">هیچ کاربری یافت نشد</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium text-gray-800">{user.name}</td>
                                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                                    <td className="py-3 px-4">
                                        {user.is_admin ? (
                                            <span className="badge bg-indigo-100 text-indigo-700">ادمین</span>
                                        ) : (
                                            <span className="badge bg-gray-100 text-gray-600">کاربر</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        {user.status === 'suspended' ? (
                                            <span className="badge bg-red-100 text-red-700">تعلیق</span>
                                        ) : (
                                            <span className="badge bg-green-100 text-green-700">فعال</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-gray-500">{formatDate(user.created_at)}</td>
                                    <td className="py-3 px-4 flex gap-2">
                                        {user.status !== 'suspended' && (
                                            <button
                                                onClick={() => openConfirm(user.id, 'suspend')}
                                                className="text-amber-600 hover:text-amber-800 transition"
                                                title="تعلیق"
                                            >
                                                <UserX className="w-4 h-4" />
                                            </button>
                                        )}
                                        {user.status === 'suspended' && (
                                            <button
                                                onClick={() => openConfirm(user.id, 'activate')}
                                                className="text-green-600 hover:text-green-800 transition"
                                                title="فعال کردن"
                                            >
                                                <UserCheck className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openConfirm(user.id, 'delete')}
                                            className="text-red-500 hover:text-red-700 transition"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button className="text-gray-400 hover:text-gray-600 transition" title="مشاهده پروفایل">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

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