
import React, { useMemo, useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { OLYMPIADS, type OlympiadId } from '../../config/olympiads'
import { OLYMPIAD_ICON_MAP } from '../../config/olympiad-icons'
import { Check } from 'lucide-react'
import { formatError } from '../../utils/error-handler'

interface OlympiadPickerProps {
    isOpen: boolean
    onClose: () => void
    currentOlympiadId: string | null
    existingSubjectNames: string[]
    onComplete?: () => void // optional callback after saving
}

export const OlympiadPicker: React.FC<OlympiadPickerProps> = ({
    isOpen,
    onClose,
    currentOlympiadId,
    existingSubjectNames,
    onComplete,
}) => {
    const { completeOnboarding } = useAuth()
    const { showToast } = useToast()
    const [selected, setSelected] = useState<OlympiadId | null>(currentOlympiadId as OlympiadId | null)
    const [checkedSubjects, setCheckedSubjects] = useState<Set<string>>(new Set())
    const [saving, setSaving] = useState(false)

    const olympiad = useMemo(() => OLYMPIADS.find((o) => o.id === selected) ?? null, [selected])

    const pick = (id: OlympiadId) => {
        setSelected(id)
        const preset = OLYMPIADS.find((o) => o.id === id)
        // فقط دروسی که هنوز در فهرست کاربر نیستند به‌صورت پیش‌فرض تیک می‌خورند
        const fresh = (preset?.defaultSubjects ?? []).filter((s) => !existingSubjectNames.includes(s.name))
        setCheckedSubjects(new Set(fresh.map((s) => s.name)))
    }

    const toggleSubject = (name: string) => {
        setCheckedSubjects((prev) => {
            const next = new Set(prev)
            if (next.has(name)) next.delete(name)
            else next.add(name)
            return next
        })
    }

    const handleSave = async () => {
        if (!selected) return
        setSaving(true)
        try {
            const preset = OLYMPIADS.find((o) => o.id === selected)
            const subjectsToAdd = (preset?.defaultSubjects ?? []).filter((s) => checkedSubjects.has(s.name))
            await completeOnboarding({ olympiadId: selected, subjects: subjectsToAdd })
            showToast('المپیاد به‌روزرسانی شد', 'success')
            onComplete?.()
            onClose()
        } catch (err) {
            showToast(formatError(err), 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="تغییر المپیاد" size="xl">
            <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {OLYMPIADS.map((o) => {
                        const Icon = OLYMPIAD_ICON_MAP[o.icon]
                        const active = selected === o.id
                        return (
                            <button
                                key={o.id}
                                type="button"
                                onClick={() => pick(o.id)}
                                className={`relative text-right p-3 rounded-xl border-2 transition-all overflow-hidden ${active ? 'border-accent ring-2 ring-accent-subtle' : 'border-border hover:border-border-strong'
                                    }`}
                            >
                                <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                                    style={{ backgroundColor: `${o.accent}1A`, color: o.accent }}
                                >
                                    <Icon className="w-4 h-4" />
                                </div>
                                <p className="text-xs font-semibold text-text-primary">{o.shortLabel}</p>
                                {active && (
                                    <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                                        <Check className="w-2.5 h-2.5 text-white" />
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {olympiad && olympiad.defaultSubjects.length > 0 && (
                    <div>
                        <p className="text-xs font-medium text-text-tertiary mb-2">
                            دروس پیشنهادی {olympiad.shortLabel} — موارد انتخاب‌شده به دروس شما اضافه می‌شود
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {olympiad.defaultSubjects.map((s) => {
                                const already = existingSubjectNames.includes(s.name)
                                const checked = checkedSubjects.has(s.name)
                                return (
                                    <button
                                        key={s.name}
                                        type="button"
                                        disabled={already}
                                        onClick={() => toggleSubject(s.name)}
                                        className={`inline-flex items-center gap-1.5 pr-3 pl-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${already
                                            ? 'opacity-50 cursor-not-allowed'
                                            : checked
                                                ? ''
                                                : 'grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                                            }`}
                                        style={{ backgroundColor: `${s.color}14`, borderColor: `${s.color}33`, color: s.color }}
                                        title={already ? 'قبلاً اضافه شده' : undefined}
                                    >
                                        {checked || already ? <Check className="w-3 h-3" /> : null}
                                        {s.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="ghost" onClick={onClose}>انصراف</Button>
                    <Button type="button" variant="primary" loading={saving} disabled={!selected} onClick={handleSave}>
                        ذخیره
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
