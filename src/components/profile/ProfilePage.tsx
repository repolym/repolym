// ============================================================
// FILE: src/components/profile/ProfilePage.tsx (COMPLETE)
// ============================================================
import React, { useState, useRef, useEffect } from 'react'
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
import { supabase } from '../../config/supabase'
import {
    User,
    Mail,
    Award,
    Palette,
    Bell,
    Edit2,
    Save,
    UserCircle2,
    LogOut,
    BookOpen,
    Plus,
    Trash2,
    Pencil,
    Camera,
    Moon,
    Sun,
    Monitor,
    Shield,
    Check,
    Loader2,
} from 'lucide-react'

// ---------- Constants ----------
const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const AVATAR_DIMENSION = 200
const AVATAR_QUALITY = 0.8

type ThemeMode = 'light' | 'dark' | 'system'
const THEME_STORAGE_KEY = 'repolym_theme_preference'

const getStoredTheme = (): ThemeMode => {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode
        if (stored && ['light', 'dark', 'system'].includes(stored)) return stored
    } catch { }
    return 'system'
}

const setStoredTheme = (theme: ThemeMode) => {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch { }
}

const applyTheme = (theme: ThemeMode) => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
}

// ---------- Avatar Helpers ----------
const resizeAndCompressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const size = Math.min(img.width, img.height, AVATAR_DIMENSION)
                canvas.width = size
                canvas.height = size
                const ctx = canvas.getContext('2d')
                if (!ctx) { reject(new Error('Failed to get canvas context')); return }
                const sx = (img.width - size) / 2
                const sy = (img.height - size) / 2
                ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size)
                canvas.toBlob(
                    (blob) => {
                        if (!blob) { reject(new Error('Failed to compress image')); return }
                        const reader2 = new FileReader()
                        reader2.onload = () => resolve(reader2.result as string)
                        reader2.onerror = () => reject(new Error('Failed to read compressed image'))
                        reader2.readAsDataURL(blob)
                    },
                    'image/jpeg',
                    AVATAR_QUALITY
                )
            }
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = e.target?.result as string
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
    })
}

// ---------- Profile Page ----------
export const ProfilePage: React.FC = () => {
    const { user, updateProfile, signOut } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const { data: subjects, loading: subjectsLoading, createSubject, updateSubject, deleteSubject, refetch: refetchSubjects } = useSubjects(user?.id ?? null)

    const [theme, setTheme] = useState<ThemeMode>(getStoredTheme)
    useEffect(() => {
        applyTheme(theme)
        setStoredTheme(theme)
    }, [theme])

    const handleThemeChange = (newTheme: ThemeMode) => setTheme(newTheme)

    const [name, setName] = useState(user?.name || '')
    const [editingName, setEditingName] = useState(false)
    const [savingName, setSavingName] = useState(false)

    const [olympiadPickerOpen, setOlympiadPickerOpen] = useState(false)
    const [subjectFormOpen, setSubjectFormOpen] = useState(false)
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null)

    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const olympiadTheme = user?.olympiad_id ? getOlympiad(user.olympiad_id) : null
    const OlympiadIcon = olympiadTheme ? OLYMPIAD_ICON_MAP[olympiadTheme.icon] : null
    const existingSubjectNames = subjects.map((s) => s.name)

    const handleSaveName = async () => {
        if (!name.trim()) { showToast('نام نمی‌تواند خالی باشد', 'error'); return }
        if (name.trim() === user?.name) { setEditingName(false); return }
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

    const handleOlympiadComplete = () => refetchSubjects()

    const handleLogout = async () => {
        await signOut()
        navigate('/login', { replace: true })
    }

    const handleCreateSubject = async (data: SubjectFormData) => {
        const ok = await createSubject(data)
        if (ok) showToast('درس اضافه شد', 'success')
        return ok
    }

    const handleUpdateSubject = async (data: SubjectFormData) => {
        if (!editingSubject) return false
        const ok = await updateSubject(editingSubject.id, data)
        if (ok) { showToast('درس ویرایش شد', 'success'); setEditingSubject(null) }
        return ok
    }

    const handleDeleteSubject = async () => {
        if (!deletingSubjectId) return
        await deleteSubject(deletingSubjectId)
        showToast('درس حذف شد', 'success')
        setDeletingSubjectId(null)
    }

    const handleAvatarClick = () => fileInputRef.current?.click()

    const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { showToast('لطفاً یک فایل تصویری انتخاب کنید', 'error'); return }
        if (file.size > MAX_AVATAR_SIZE) {
            showToast(`حجم تصویر نباید بیشتر از ${MAX_AVATAR_SIZE / 1024 / 1024}MB باشد`, 'error')
            return
        }
        setUploadingAvatar(true)
        try {
            const compressedBase64 = await resizeAndCompressImage(file)
            const fileName = `avatar_${user?.id}_${Date.now()}.jpg`
            const filePath = `avatars/${user?.id}/${fileName}`
            const blob = await fetch(compressedBase64).then(r => r.blob())
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob, {
                contentType: 'image/jpeg',
                upsert: true,
            })
            if (uploadError) { showToast('خطا در آپلود تصویر', 'error'); return }
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
            await updateProfile({ name: user?.name || '' })
            const { error: updateError } = await supabase
                .from('users')
                .update({ preferences: { ...(user?.preferences || {}), avatar_url: publicUrl } })
                .eq('id', user?.id)
            if (updateError) { showToast('خطا در ذخیره آواتار', 'error'); return }
            showToast('آواتار با موفقیت به‌روزرسانی شد', 'success')
            window.location.reload()
        } catch (err) {
            showToast(formatError(err), 'error')
        } finally {
            setUploadingAvatar(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const avatarUrl = user?.preferences?.avatar_url as string | undefined

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">پروفایل</h1>
                    <p className="text-sm text-gray-500 mt-1">اطلاعات حساب کاربری و تنظیمات</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    خروج
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="font-semibold text-gray-800 text-lg">اطلاعات شخصی</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="آواتار" className="w-full h-full object-cover" />
                                    ) : (
                                        user?.name?.charAt(0) || '?'
                                    )}
                                </div>
                                <button
                                    onClick={handleAvatarClick}
                                    disabled={uploadingAvatar}
                                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                                    title="تغییر آواتار"
                                >
                                    {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                                <p className="text-xs text-gray-400">تصویر پروفایل • حداکثر ۲MB</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">ایمیل</p>
                                <p className="text-sm font-medium text-gray-800">{user?.email}</p>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <UserCircle2 className="w-5 h-5 text-gray-400" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400">نام</p>
                                    {editingName ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" placeholder="نام خود را وارد کنید" autoFocus />
                                            <Button variant="primary" size="sm" loading={savingName} onClick={handleSaveName}>
                                                <Save className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => { setEditingName(false); setName(user?.name || '') }}>
                                                انصراف
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                                            <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Award className="w-5 h-5 text-amber-600" />
                        </div>
                        <h2 className="font-semibold text-gray-800">المپیاد</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {olympiadTheme && OlympiadIcon ? (
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${olympiadTheme.accent}1A`, color: olympiadTheme.accent }}>
                                <OlympiadIcon className="w-6 h-6" />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xl">?</div>
                        )}
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{olympiadTheme ? olympiadTheme.label : 'المپیادی انتخاب نشده'}</p>
                            <p className="text-xs text-gray-400">{olympiadTheme ? olympiadTheme.tagline : 'از دکمهٔ تغییر استفاده کنید'}</p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setOlympiadPickerOpen(true)}>تغییر</Button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                            <Palette className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="font-semibold text-gray-800">تم</h2>
                    </div>
                    <div className="flex gap-2">
                        {[
                            { mode: 'light', label: 'روشن', icon: Sun },
                            { mode: 'dark', label: 'تاریک', icon: Moon },
                            { mode: 'system', label: 'سیستم', icon: Monitor },
                        ].map(({ mode, label, icon: Icon }) => {
                            const isActive = theme === mode
                            return (
                                <button
                                    key={mode}
                                    onClick={() => handleThemeChange(mode as ThemeMode)}
                                    className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${isActive
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-xs font-medium">{label}</span>
                                    {isActive && <Check className="w-3 h-3 text-indigo-600" />}
                                </button>
                            )
                        })}
                    </div>
                </div>

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
                    {subjectsLoading && subjects.length === 0 ? (
                        <p className="text-sm text-gray-400">در حال بارگذاری...</p>
                    ) : subjects.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                                <BookOpen className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600 font-medium mb-1">هیچ درسی تعریف نشده است</p>
                            <p className="text-xs text-gray-400">برای شروع، اولین درس خود را اضافه کنید</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {subjects.map((s) => (
                                <div key={s.id} className="card-hover px-4 py-3 flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                    <span className="text-sm text-text-primary flex-1">{s.name}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditingSubject(s); setSubjectFormOpen(true) }} className="btn-ghost text-xs">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setDeletingSubjectId(s.id)} className="btn-ghost text-xs hover:text-danger">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 lg:col-span-2">
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

                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-purple-600" />
                        </div>
                        <h2 className="font-semibold text-gray-800">حریم خصوصی</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">دسترسی به داده‌ها و تنظیمات حریم خصوصی</p>
                        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">به‌زودی</span>
                    </div>
                </div>
            </div>

            <OlympiadPicker
                isOpen={olympiadPickerOpen}
                onClose={() => setOlympiadPickerOpen(false)}
                currentOlympiadId={user?.olympiad_id ?? null}
                existingSubjectNames={existingSubjectNames}
                onComplete={handleOlympiadComplete}
            />

            <SubjectForm
                isOpen={subjectFormOpen}
                onClose={() => { setSubjectFormOpen(false); setEditingSubject(null) }}
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

export default ProfilePage