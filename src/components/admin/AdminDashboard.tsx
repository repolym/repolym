import React, { useEffect, useState } from 'react'
import { supabase } from '../../config/supabase'
import { formatMinutes } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'

interface UserStats {
    id: string
    email: string
    name: string
    total_minutes: number
}

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<UserStats[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // Fetch all users
                const { data: profiles, error: userError } = await supabase
                    .from('users')
                    .select('id, email, name')

                if (userError) throw userError

                // Fetch total study time per user
                const { data: sessions, error: sessionError } = await supabase
                    .from('study_sessions')
                    .select('user_id, duration_minutes')

                if (sessionError) throw sessionError

                // Aggregate
                const totals: Record<string, number> = {}
                for (const s of sessions || []) {
                    totals[s.user_id] = (totals[s.user_id] || 0) + (s.duration_minutes || 0)
                }

                const combined: UserStats[] = (profiles || []).map(p => ({
                    ...p,
                    total_minutes: totals[p.id] || 0,
                }))

                // Sort by name
                combined.sort((a, b) => a.name.localeCompare(b.name, 'fa'))
                setUsers(combined)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="p-6 text-center">
                <p className="text-text-tertiary">در حال بارگذاری اطلاعات کاربران...</p>
            </div>
        )
    }

    return (
        <div className="p-5 md:p-6 max-w-4xl mx-auto" dir="rtl">
            <h1 className="text-base font-semibold text-text-primary mb-6">مدیریت کاربران</h1>
            <div className="card p-4 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border-subtle text-text-secondary text-xs">
                            <th className="text-right py-3 px-2">نام</th>
                            <th className="text-right py-3 px-2">ایمیل</th>
                            <th className="text-right py-3 px-2">مجموع ساعات مطالعه</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="py-8 text-center text-text-tertiary">
                                    هیچ کاربری یافت نشد
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-2 transition-colors">
                                    <td className="py-3 px-2 font-medium text-text-primary">{u.name}</td>
                                    <td className="py-3 px-2 text-text-tertiary text-xs">{u.email}</td>
                                    <td className="py-3 px-2 font-mono">{formatMinutes(u.total_minutes)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default AdminDashboard