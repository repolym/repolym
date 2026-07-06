// ============================================================
// FILE: src/components/profile/AvatarCropModal.tsx (NEW)
// ============================================================
// A small, dependency-free image cropper for profile photos.
// The user can drag to reposition and use the slider (or mouse
// wheel) to zoom, then confirm to produce a square, compressed
// JPEG data URL ready to upload.
import React, { useEffect, useRef, useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { ZoomIn, ZoomOut } from 'lucide-react'

// ---------- Constants ----------
const VIEWPORT_SIZE = 260 // px, on-screen crop circle size
const OUTPUT_SIZE = 320 // px, exported square image resolution
const OUTPUT_QUALITY = 0.85
const MIN_ZOOM = 1
const MAX_ZOOM = 3

interface Offset {
    x: number
    y: number
}

interface AvatarCropModalProps {
    isOpen: boolean
    imageSrc: string | null
    loading?: boolean
    onClose: () => void
    onConfirm: (croppedDataUrl: string) => void
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
    isOpen,
    imageSrc,
    loading,
    onClose,
    onConfirm,
}) => {
    const imgRef = useRef<HTMLImageElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
    const [zoom, setZoom] = useState(MIN_ZOOM)
    const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
    const dragState = useRef<{ startX: number; startY: number; startOffset: Offset } | null>(null)

    // Reset crop state whenever a new image is loaded into the modal.
    useEffect(() => {
        if (!isOpen) return
        setZoom(MIN_ZOOM)
        setOffset({ x: 0, y: 0 })
        setNaturalSize(null)
    }, [isOpen, imageSrc])

    const baseScale = naturalSize
        ? Math.max(VIEWPORT_SIZE / naturalSize.w, VIEWPORT_SIZE / naturalSize.h)
        : 1
    const effectiveScale = baseScale * zoom
    const displayWidth = naturalSize ? naturalSize.w * effectiveScale : 0
    const displayHeight = naturalSize ? naturalSize.h * effectiveScale : 0

    const clampOffset = (next: Offset, scale = effectiveScale): Offset => {
        if (!naturalSize) return next
        const w = naturalSize.w * scale
        const h = naturalSize.h * scale
        const minX = Math.min(0, VIEWPORT_SIZE - w)
        const minY = Math.min(0, VIEWPORT_SIZE - h)
        return {
            x: Math.min(0, Math.max(next.x, minX)),
            y: Math.min(0, Math.max(next.y, minY)),
        }
    }

    const handleImgLoad = () => {
        const img = imgRef.current
        if (!img) return
        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
        setOffset({ x: 0, y: 0 })
    }

    // ---------- Zoom (anchored at viewport center so the image
    // doesn't visually "jump" while zooming in/out) ----------
    const applyZoom = (newZoom: number) => {
        if (!naturalSize) { setZoom(newZoom); return }
        const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom))
        const oldScale = baseScale * zoom
        const newScale = baseScale * clampedZoom
        const center = VIEWPORT_SIZE / 2
        // Natural-image point currently under the viewport center.
        const pointX = (center - offset.x) / oldScale
        const pointY = (center - offset.y) / oldScale
        const nextOffset = clampOffset(
            { x: center - pointX * newScale, y: center - pointY * newScale },
            newScale
        )
        setZoom(clampedZoom)
        setOffset(nextOffset)
    }

    // ---------- Drag to pan ----------
    const handlePointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        dragState.current = { startX: e.clientX, startY: e.clientY, startOffset: offset }
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragState.current) return
        const dx = e.clientX - dragState.current.startX
        const dy = e.clientY - dragState.current.startY
        setOffset(clampOffset({ x: dragState.current.startOffset.x + dx, y: dragState.current.startOffset.y + dy }))
    }

    const handlePointerUp = () => {
        dragState.current = null
    }

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        applyZoom(zoom - e.deltaY * 0.0015)
    }

    // ---------- Produce the final cropped square image ----------
    const handleConfirm = () => {
        const img = imgRef.current
        if (!img || !naturalSize) return

        const sx = -offset.x / effectiveScale
        const sy = -offset.y / effectiveScale
        const sSize = VIEWPORT_SIZE / effectiveScale

        const canvas = document.createElement('canvas')
        canvas.width = OUTPUT_SIZE
        canvas.height = OUTPUT_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

        const dataUrl = canvas.toDataURL('image/jpeg', OUTPUT_QUALITY)
        onConfirm(dataUrl)
    }

    return (
        <Modal isOpen={isOpen && !!imageSrc} onClose={onClose} title="برش تصویر پروفایل" size="sm">
            <div className="flex flex-col items-center gap-4">
                <div
                    ref={containerRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onWheel={handleWheel}
                    className="relative overflow-hidden rounded-full bg-surface-3 border border-border-subtle touch-none select-none cursor-grab active:cursor-grabbing"
                    style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
                >
                    {imageSrc && (
                        // eslint-disable-next-line jsx-a11y/alt-text
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            onLoad={handleImgLoad}
                            draggable={false}
                            className="absolute top-0 left-0 max-w-none pointer-events-none"
                            style={{
                                width: displayWidth || undefined,
                                height: displayHeight || undefined,
                                transform: `translate(${offset.x}px, ${offset.y}px)`,
                            }}
                        />
                    )}
                </div>

                <p className="text-xs text-text-tertiary text-center">
                    تصویر را بکشید تا جابجا شود و از اسلایدر برای بزرگ‌نمایی استفاده کنید
                </p>

                <div className="flex items-center gap-3 w-full px-2">
                    <ZoomOut className="w-4 h-4 text-text-tertiary shrink-0" />
                    <input
                        type="range"
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => applyZoom(parseFloat(e.target.value))}
                        className="flex-1 accent-accent"
                        disabled={!naturalSize}
                    />
                    <ZoomIn className="w-4 h-4 text-text-tertiary shrink-0" />
                </div>

                <div className="flex gap-2 justify-end w-full">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        انصراف
                    </Button>
                    <Button variant="primary" onClick={handleConfirm} loading={loading} loadingText="در حال آپلود..." disabled={!naturalSize}>
                        تایید و ذخیره
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default AvatarCropModal
