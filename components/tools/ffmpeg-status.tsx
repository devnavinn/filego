"use client"

import { Progress } from "@/components/ui/progress"

type FFmpegStatusProps = {
    isLoadingEngine: boolean
    isProcessing: boolean
    progress: number
    statusText?: string
}

export function FFmpegStatus({ isLoadingEngine, isProcessing, progress, statusText }: FFmpegStatusProps) {
    if (!isLoadingEngine && !isProcessing) return null

    return (
        <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">
                {isLoadingEngine
                    ? "Loading video engine (first time only, ~30MB)..."
                    : statusText || "Processing..."}
            </p>
            {isProcessing && <Progress value={Math.round(progress * 100)} className="h-1.5" />}
        </div>
    )
}
