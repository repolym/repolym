// src/components/admin/AdminManagement.tsx
import React, { useState } from 'react'
import { useAdminUsers } from '../../hooks/useAdminUsers'
import { useToast } from '../../context/ToastContext'
import { Button } from '../common/Button'
import { ConfirmModal } from '../common/Modal'
import { formatDate } from '../../utils/date-utils'
import { RefreshCw, UserPlus, UserMinus } from 'lucide-react'
import { adminService } from '../../services/adminService'

export const AdminManagement: React.FC = () => {
    const { showToast } = useToast()
    const { users, loading, error, refetch } = useAdminUsers({ isAdmin: true })
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [modalAction, setModalAction] = useState<'promote' | 'demote' | null>(null)
    const [processing, setProcessing] = useState(false)

    // Get non-admin users for promotion
    const { users: nonAdmins } = useAdminUsers({ isAdmin: false })

    const handleAction = async (userId: string, action: 'promote' | 'demote') => {
        setProcessing(true)
        try {
            if (action === 'promote') {
                await adminService.makeAdmin(userId)
                showToast('کاربر به ادمین ارتقا یافت', 'success')
            } else {
                await adminService.removeAdmin(userId)
                showToast('دسترسی ادمین لغو شد', 'success')
            }
            await refetch()
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

    return (
        <div className="p-5 md:p-8 max-w-6xl mx-auto" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">مدیریت ادمین‌ها</h1>
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

            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">ارتقا به ادمین</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {nonAdmins.slice(0, 10).map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm font-medium text-gray-700">{u.name}</span>
                            <Button variant="primary" size="sm" onClick={() => openConfirm(u.id, 'promote')}>
                                <UserPlus className="w-4 h-4" />
                                ارتقا
                            </Button>
                        </div>
                    ))}
                    {nonAdmins.length === 0 && (
                        <p className="text-gray-400 text-sm">همه کاربران ادمین هستند.</p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                            <th className="text-right py-3 px-4">نام</th>
                            <th className="text-right py-3 px-4">ایمیل</th>
                            <th className="text-right py-3 px-4">تاریخ عضویت</th>
                            <th className="text-right py-3 px-4">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && users.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-8 text-gray-400">در حال بارگذاری...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-8 text-gray-400">هیچ ادمینی یافت نشد</td></tr>
                        ) : (
                            users.map((admin) => (
                                <tr key={admin.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium text-gray-800">{admin.name}</td>
                                    <td className="py-3 px-4 text-gray-600">{admin.email}</td>
                                    <td className="py-3 px-4 text-gray-500">{formatDate(admin.created_at)}</td>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() => openConfirm(admin.id, 'demote')}
                                            className="text-amber-600 hover:text-amber-800 transition"
                                            title="لغو دسترسی ادمین"
                                        >
                                            <UserMinus className="w-4 h-4" />
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