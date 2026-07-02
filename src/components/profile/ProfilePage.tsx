import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useSubjects } from '../../hooks/useSubjects'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import type { Subject } from '../../types/database'
import { ConfirmModal } from '../common/Modal'
import { SubjectForm, SubjectFormData } from '../common/SubjectForm'
import { OlympiadPicker } from '../common/OlympiadPicker'
import { getOlympiad } from '../../config/olympiads'
import { OLYMPIAD_ICON_MAP } from '../../config/olympiad-icons'
import { formatError } from '../../utils/error-handler'
import {
    User,
    Mail,
    Award,
    Palette,
    Bell,
    Settings,
    Edit2,
    Save,
    UserCircle2,
    LogOut,
    BookOpen,
    Plus,
    Trash2,
    Pencil,
} from 'lucide-react'

export const ProfilePage: React.FC = () => {
    const { user, updateProfile, signOut } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const { data: subjects, loading, createSubject, updateSubject, deleteSubject, refetch: refetchSubjects } = useSubjects(user?.id ?? null)

    // --- State for Name Editing ---
    const [name, setName] = useState(user?.name || '')
    const [editingName, setEditingName] = useState(false)
    const [savingName, setSavingName] = useState(false)

    // --- State for Olympiad Picker ---
    const [olympiadPickerOpen, setOlympiadPickerOpen] = useState(false)

    // --- State for Subject Management ---
    const [subjectFormOpen, setSubjectFormOpen] = useState(false)
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null)

    // --- Derived ---
    const olympiadTheme = user?.olympiad_id ? getOlympiad(user.olympiad_id) : null
    const OlympiadIcon = olympiadTheme ? OLYMPIAD_ICON_MAP[olympiadTheme.icon] : null
    const existingSubjectNames = subjects.map((s) => s.name)

    // --- Handlers ---
    const handleSaveName = async () => {
        if (!name.trim()) {
            showToast('نام نمی‌تواند خالی باشد', 'error')
            return
        }
        if (name.trim() === user?.name) {
            setEditingName(false)
            return
        }
        setSavingName(true)
        try {
            await updateProfile({ name: name.trim() })
            showToast('نام با موفقیت به‌روزرسانی شد', 'success')
            setEditingName(false)
        } catch (err) {
            showToast(formatError(err), 'error')
        } finally {
            setSavingName(false)
        }
    }

    const handleOlympiadComplete = () => {
        refetchSubjects()
    }

    const handleLogout = async () => {
        await signOut()
        navigate('/login', { replace: true })
    }

    // --- Subject Handlers ---
    const handleCreateSubject = async (data: SubjectFormData) => {
        const ok = await createSubject(data)
        if (ok) showToast('درس اضافه شد', 'success')
        return ok
    }

    const handleUpdateSubject = async (data: SubjectFormData) => {
        if (!editingSubject) return false
        const ok = await updateSubject(editingSubject.id, data)
        if (ok) {
            showToast('درس ویرایش شد', 'success')
            setEditingSubject(null)
        }
        return ok
    }

    const handleDeleteSubject = async () => {
        if (!deletingSubjectId) return
        await deleteSubject(deletingSubjectId)
        showToast('درس حذف شد', 'success')
        setDeletingSubjectId(null)
    }

    return (
        <div className="p-5 md:p-8 max-w-4xl mx-auto space-y-8" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">پروفایل</h1>
                <p className="text-sm text-gray-500 mt-1">اطلاعات حساب کاربری و تنظیمات</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* --- Personal Info --- */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="font-semibold text-gray-800 text-lg">اطلاعات شخصی</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Email (read-only) */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">ایمیل</p>
                                <p className="text-sm font-medium text-gray-800">{user?.email}</p>
                            </div>
                        </div>

                        {/* Name (editable) */}
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <UserCircle2 className="w-5 h-5 text-gray-400" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400">نام</p>
                                    {editingName ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="flex-1"
                                                placeholder="نام خود را وارد کنید"
                                                autoFocus
                                            />
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                loading={savingName}
                                                onClick={handleSaveName}
                                            >
                                                <Save className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingName(false)
                                                    setName(user?.name || '')
                                                }}
                                            >
                                                انصراف
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                                            <button
                                                onClick={() => setEditingName(true)}
                                                className="text-gray-400 hover:text-indigo-600 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Olympiad --- */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Award className="w-5 h-5 text-amber-600" />
                        </div>
                        <h2 className="font-semibold text-gray-800">المپیاد</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        {olympiadTheme && OlympiadIcon ? (
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${olympiadTheme.accent}1A`, color: olympiadTheme.accent }}
                            >
                                <OlympiadIcon className="w-6 h-6" />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xl">
                                ?
                            </div>
                        )}
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                                {olympiadTheme ? olympiadTheme.label : 'المپیادی انتخاب نشده'}
                            </p>
                            <p className="text-xs text-gray-400">
                                {olympiadTheme ? olympiadTheme.tagline : 'از دکمهٔ تغییر استفاده کنید'}
                            </p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setOlympiadPickerOpen(true)}>
                            تغییر
                        </Button>
                    </div>
                </div>

                {/* --- Avatar (Placeholder) --- */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                            <UserCircle2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <h2 className="font-semibold text-gray-800">آواتار</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                            {user?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">تصویر پروفایل</p>
                            <p className="text-xs text-gray-400">به‌زودی امکان آپلود اضافه می‌شود</p>
                        </div>
                    </div>
                </div>

                {/* --- Theme (Placeholder) --- */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                            <Palette className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="font-semibold text-gray-800">تم</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">حالت روشن / تاریک</p>
                        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">به‌زودی</span>
                    </div>
                </div>

                {/* --- Notifications (Placeholder) --- */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="font-semibold text-gray-800">اعلان‌ها</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">یادآوری‌ها و هشدارها</p>
                        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">به‌زودی</span>
                    </div>
                </div>

                {/* --- SUBJECTS (NEW) --- */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h2 className="font-semibold text-gray-800">دروس</h2>
                        </div>
                        <Button variant="primary" size="sm" onClick={() => setSubjectFormOpen(true)}>
                            <Plus className="w-4 h-4" />
                            درس جدید
                        </Button>
                    </div>

                    {loading && subjects.length === 0 ? (
                        <p className="text-sm text-gray-400">در حال بارگذاری...</p>
                    ) : subjects.length === 0 ? (
                        <p className="text-sm text-gray-400">هیچ درسی تعریف نشده است.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {subjects.map((s) => (
                                <div key={s.id} className="card-hover px-4 py-3 flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-2xs flex-shrink-0" style={{ backgroundColor: s.color }} />
                                    <span className="text-sm text-text-primary flex-1">{s.name}</span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => {
                                                setEditingSubject(s)
                                                setSubjectFormOpen(true)
                                            }}
                                            className="btn-ghost text-xs"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setDeletingSubjectId(s.id)}
                                            className="btn-ghost text-xs hover:text-danger"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- Logout Button --- */}
                <div className="lg:col-span-2">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-2xl text-red-700 font-medium transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        خروج از حساب کاربری
                    </button>
                </div>
            </div>

            {/* --- Modals --- */}
            <OlympiadPicker
                isOpen={olympiadPickerOpen}
                onClose={() => setOlympiadPickerOpen(false)}
                currentOlympiadId={user?.olympiad_id ?? null}
                existingSubjectNames={existingSubjectNames}
                onComplete={handleOlympiadComplete}
            />

            <SubjectForm
                isOpen={subjectFormOpen}
                onClose={() => {
                    setSubjectFormOpen(false)
                    setEditingSubject(null)
                }}
                onSubmit={editingSubject ? handleUpdateSubject : handleCreateSubject}
                editing={editingSubject}
            />

            <ConfirmModal
                isOpen={!!deletingSubjectId}
                onClose={() => setDeletingSubjectId(null)}
                onConfirm={handleDeleteSubject}
                title="حذف درس"
                message="این درس حذف می‌شود. جلسات مرتبط بدون درس باقی می‌مانند."
                confirmLabel="حذف"
            />
        </div>
    )
}