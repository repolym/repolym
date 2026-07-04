import React, { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { Input } from './Input'
import { Button } from './Button'
import type { Subject } from '../../types/database'

const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6',
    '#f97316', '#06b6d4',
]

export interface SubjectFormData {
    name: string
    color: string
}

interface SubjectFormProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: SubjectFormData) => Promise<boolean>
    editing?: Subject | null
}

export const SubjectForm: React.FC<SubjectFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    editing,
}) => {
    const [name, setName] = useState('')
    const [color, setColor] = useState(PRESET_COLORS[0])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (editing) {
            setName(editing.name)
            setColor(editing.color)
        } else {
            setName('')
            setColor(PRESET_COLORS[0])
        }
        setError('')
    }, [editing, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            setError('نام درس الزامی است')
            return
        }
        setLoading(true)
        try {
            const ok = await onSubmit({ name: name.trim(), color })
            if (ok) onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? 'ویرایش درس' : 'درس جدید'}
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="نام درس"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثلاً: ریاضی، فیزیک"
                    error={error}
                    required
                    autoFocus
                />
                <div>
                    <p className="text-xs font-medium text-text-secondary mb-2">رنگ</p>
                    <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className="w-7 h-7 rounded-xs transition-transform hover:scale-110"
                                style={{
                                    backgroundColor: c,
                                    outline: color === c ? `2px solid ${c}` : 'none',
                                    outlineOffset: '2px',
                                }}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        انصراف
                    </Button>
                    <Button type="submit" variant="primary" loading={loading}>
                        {editing ? 'ذخیره' : 'افزودن'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}