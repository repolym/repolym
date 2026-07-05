// src/components/admin/AdminProfile.tsx
import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { User, Mail, Shield, Calendar, LogOut, Key, Save } from 'lucide-react'
import { formatDate } from '../../utils/date-utils'
import { supabase } from '../../config/supabase'
import { formatError } from '../../utils/error-handler'
import { useNavigate } from 'react-router-dom'

export const AdminProfile: React.FC = () => {
    const { user, signOut } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [name, setName] = useState(user?.name || '')
    const [editingName, setEditingName] = useState(false)
    const [savingName, setSavingName] = useState(false)
    const [password, setPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [changingPassword, setChangingPassword] = useState(false)

    const handleSaveName = async () => {
        if (!name.trim() || name.trim() === user?.name) {
            setEditingName(false)
            return
        }
        setSavingName(true)
        try {
            const { error } = await supabase
                .from('users')
                .update({ name: name.trim() })
                .eq('id', user!.id)
            if (error) throw error
            showToast('نام با موفقیت به‌روزرسانی شد', 'success')
            setEditingName(false)
        } catch (err) {
            showToast(formatError(err), 'error')
        } finally {
            setSavingName(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            showToast('رمز عبور جدید و تأیید آن مطابقت ندارند', 'error')
            return
        }
        if (newPassword.length < 8) {
            showToast('رمز عبور باید حداقل ۸ کاراکتر باشد', 'error')
            return
        }
        setChangingPassword(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error
            showToast('رمز عبور با موفقیت تغییر کرد', 'success')
            setPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err) {
            showToast(formatError(err), 'error')
        } finally {
            setChangingPassword(false)
        }
    }

    const handleLogout = async () => {
        await signOut()
        navigate('/login', { replace: true })
    }

    return (
        <div className="p-5 md:p-8 max-w-3xl mx-auto" dir="rtl">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">پروفایل ادمین</h1>

            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {user?.email}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            {user?.is_admin ? 'مدیر سیستم' : 'کاربر عادی'}
                        </p>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">نام</span>
                        </div>
                        {editingName ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-48"
                                    autoFocus
                                />
                                <Button variant="primary" size="sm" loading={savingName} onClick={handleSaveName}>
                                    <Save className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => { setEditingName(false); setName(user?.name || '') }}>
                                    انصراف
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-800">{user?.name}</span>
                                <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-indigo-600">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">تاریخ عضویت</span>
                        </div>
                        <span className="text-sm text-gray-600">
                            {user?.created_at ? formatDate(user.created_at) : '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">آخرین ورود</span>
                        </div>
                        <span className="text-sm text-gray-600">
                            {user?.last_login ? formatDate(user.last_login) : '—'}
                        </span>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Key className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">تغییر رمز عبور</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input
                                type="password"
                                placeholder="رمز فعلی"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Input
                                type="password"
                                placeholder="رمز جدید"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <Input
                                type="password"
                                placeholder="تأید رمز جدید"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" variant="primary" loading={changingPassword}>
                            تغییر رمز عبور
                        </Button>
                    </form>
                </div>

                <div className="border-t border-gray-100 pt-4">
                    <Button variant="danger" onClick={handleLogout} className="w-full md:w-auto">
                        <LogOut className="w-4 h-4" />
                        خروج از حساب
                    </Button>
                </div>
            </div>
        </div>
    )
}