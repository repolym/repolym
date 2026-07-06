// src/components/common/Avatar.tsx
import React from 'react'

interface AvatarProps {
    /** Full name, used to compute the initials fallback */
    name?: string | null
    /** Public URL of the uploaded photo (user.preferences.avatar_url) */
    avatarUrl?: string | null
    /**
     * Controls size/shape/background — pass the same classes the call site
     * already used for its circle, e.g.
     * "w-16 h-16 rounded-full bg-accent text-white text-2xl font-bold"
     */
    className?: string
    /** How many letters to show when falling back to initials (default 1) */
    initialsCount?: 1 | 2
    /**
     * Custom fallback node shown instead of initials when there's no photo
     * (e.g. an emoji placeholder on the leaderboard podium). If omitted,
     * initials are shown.
     */
    fallback?: React.ReactNode
}

const getInitials = (name: string | null | undefined, count: 1 | 2): string => {
    if (!name) return '?'
    if (count === 1) return name.charAt(0) || '?'
    const initials = name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
    return initials || '?'
}

/**
 * Shared avatar: shows the user's uploaded photo when present, otherwise
 * falls back to initials (or a custom `fallback` node). Centralizes the
 * photo/fallback logic so every screen that shows a user's name/photo
 * behaves the same way.
 */
export const Avatar: React.FC<AvatarProps> = ({
    name,
    avatarUrl,
    className = '',
    initialsCount = 1,
    fallback,
}) => {
    return (
        <div className={`flex items-center justify-center overflow-hidden ${className}`}>
            {avatarUrl ? (
                <img src={avatarUrl} alt={name || 'آواتار'} className="w-full h-full object-cover" />
            ) : fallback !== undefined ? (
                fallback
            ) : (
                <span>{getInitials(name, initialsCount)}</span>
            )}
        </div>
    )
}

/**
 * Pulls the avatar URL out of the untyped `preferences` JSON blob that
 * user rows store it in (see ProfilePage.tsx's upload flow), so call
 * sites don't have to repeat the `as string | undefined` cast.
 */
export const getAvatarUrl = (preferences?: Record<string, unknown> | null): string | undefined => {
    const value = preferences?.avatar_url
    return typeof value === 'string' ? value : undefined
}

export default Avatar
