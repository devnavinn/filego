"use client"

import { useRef, useState } from "react"
import { GripVertical } from "lucide-react"

import { formatDurationPrecise } from "@/lib/video-tool-utils"
import { cn } from "@/lib/utils"

const MIN_SELECTION_SECONDS = 0.3

type VideoTimelineTrimmerProps = {
    duration: number
    range: [number, number]
    onRangeChange: (range: [number, number]) => void
    thumbnails: string[]
    isGeneratingThumbnails?: boolean
    playheadPercent?: number | null
}

export function VideoTimelineTrimmer({
    duration,
    range,
    onRangeChange,
    thumbnails,
    isGeneratingThumbnails = false,
    playheadPercent = null,
}: VideoTimelineTrimmerProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [dragging, setDragging] = useState<"start" | "end" | null>(null)
    const [dragPercent, setDragPercent] = useState(0)

    const startPercent = duration > 0 ? (range[0] / duration) * 100 : 0
    const endPercent = duration > 0 ? (range[1] / duration) * 100 : 100

    function handlePointerDown(handle: "start" | "end") {
        return (e: React.PointerEvent) => {
            e.preventDefault()
            const container = containerRef.current
            if (!container || duration <= 0) return
            const rect = container.getBoundingClientRect()

            setDragging(handle)

            function update(clientX: number) {
                const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
                setDragPercent(ratio * 100)
                const time = ratio * duration

                if (handle === "start") {
                    const next = Math.min(time, range[1] - MIN_SELECTION_SECONDS)
                    onRangeChange([Math.max(0, next), range[1]])
                } else {
                    const next = Math.max(time, range[0] + MIN_SELECTION_SECONDS)
                    onRangeChange([range[0], Math.min(duration, next)])
                }
            }

            update(e.clientX)

            function handleMove(ev: PointerEvent) {
                update(ev.clientX)
            }

            function handleUp() {
                setDragging(null)
                window.removeEventListener("pointermove", handleMove)
                window.removeEventListener("pointerup", handleUp)
            }

            window.addEventListener("pointermove", handleMove)
            window.addEventListener("pointerup", handleUp)
        }
    }

    return (
        <div className="space-y-2">
            <div
                ref={containerRef}
                className="relative h-16 touch-none overflow-hidden rounded-xl border border-border/60 bg-muted select-none"
            >
                {isGeneratingThumbnails ? (
                    <div className="absolute inset-0 animate-pulse bg-muted-foreground/10" />
                ) : (
                    <div className="absolute inset-0 flex">
                        {thumbnails.map((src, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                key={i}
                                src={src}
                                alt=""
                                draggable={false}
                                className="h-full flex-1 object-cover"
                            />
                        ))}
                    </div>
                )}

                <div
                    className="absolute inset-y-0 left-0 bg-background/70"
                    style={{ width: `${startPercent}%` }}
                />
                <div
                    className="absolute inset-y-0 right-0 bg-background/70"
                    style={{ width: `${100 - endPercent}%` }}
                />

                <div
                    className="absolute inset-y-0 border-y-2 border-primary"
                    style={{ left: `${startPercent}%`, right: `${100 - endPercent}%` }}
                />

                {playheadPercent !== null && playheadPercent >= startPercent && playheadPercent <= endPercent && (
                    <div
                        className="absolute inset-y-0 w-0.5 bg-foreground"
                        style={{ left: `${playheadPercent}%` }}
                    />
                )}

                {(["start", "end"] as const).map((handle) => {
                    const percent = handle === "start" ? startPercent : endPercent
                    return (
                        <button
                            key={handle}
                            type="button"
                            aria-label={handle === "start" ? "Trim start" : "Trim end"}
                            onPointerDown={handlePointerDown(handle)}
                            className="absolute inset-y-0 flex w-4 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full bg-primary"
                            style={{ left: `${percent}%` }}
                        >
                            <GripVertical className="h-3.5 w-3.5 text-primary-foreground" />
                        </button>
                    )
                })}

                {dragging && (
                    <div
                        className={cn(
                            "absolute -top-8 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background"
                        )}
                        style={{ left: `${dragPercent}%` }}
                    >
                        {formatDurationPrecise((dragPercent / 100) * duration)}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{formatDurationPrecise(range[0])}</span>
                <span>{formatDurationPrecise(range[1] - range[0])} selected</span>
                <span>{formatDurationPrecise(range[1])}</span>
            </div>
        </div>
    )
}
