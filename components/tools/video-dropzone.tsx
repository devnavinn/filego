"use client"

import { useRef, useState } from "react"
import { RefreshCw, Upload, Video, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/image-utils"
import { formatDuration, type VideoMeta } from "@/lib/video-tool-utils"
import { cn } from "@/lib/utils"

type VideoDropzoneProps = {
    onFileSelect: (file: File) => void
    file?: File | null
    previewUrl?: string | null
    meta?: VideoMeta | null
    onClear?: () => void
    accept?: string
    hint?: string
    className?: string
}

export function VideoDropzone({
    onFileSelect,
    file = null,
    previewUrl = null,
    meta = null,
    onClear,
    accept = "video/*",
    hint = "MP4, MOV, WEBM, or AVI",
    className,
}: VideoDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)

    function handleFiles(fileList: FileList | null) {
        const next = fileList?.[0]
        if (next) onFileSelect(next)
    }

    const fileInput = (
        <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
                handleFiles(e.target.files)
                e.target.value = ""
            }}
        />
    )

    if (file) {
        return (
            <div className={cn("overflow-hidden rounded-2xl border border-border/60 bg-card", className)}>
                {previewUrl && (
                    <video src={previewUrl} controls className="max-h-72 w-full bg-black" />
                )}
                <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-2.5">
                    <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{file.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                            {formatBytes(file.size)}
                            {meta && ` · ${formatDuration(meta.duration)} · ${meta.width}x${meta.height}`}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => inputRef.current?.click()}
                        >
                            <RefreshCw />
                            Change
                        </Button>
                        {onClear && (
                            <Button type="button" variant="ghost" size="icon-sm" className="rounded-full" onClick={onClear}>
                                <X />
                            </Button>
                        )}
                    </div>
                </div>
                {fileInput}
            </div>
        )
    }

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                handleFiles(e.dataTransfer.files)
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
            }}
            className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center transition-colors sm:p-10",
                isDragging ? "border-primary bg-primary/5" : "border-border/60 bg-muted/30 hover:bg-muted/50",
                className
            )}
        >
            {isDragging ? <Upload className="h-6 w-6 text-muted-foreground" /> : <Video className="h-6 w-6 text-muted-foreground" />}
            <p className="text-sm font-medium">Click to upload or drag & drop</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
            {fileInput}
        </div>
    )
}
