"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, RefreshCw, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/image-utils"
import { cn } from "@/lib/utils"

type ImageDropzoneProps = {
    onFileSelect: (file: File) => void
    file?: File | null
    onClear?: () => void
    accept?: string
    hint?: string
    className?: string
}

const CHECKERBOARD_STYLE = {
    backgroundImage:
        "linear-gradient(45deg, var(--color-border) 25%, transparent 25%), linear-gradient(-45deg, var(--color-border) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-border) 75%), linear-gradient(-45deg, transparent 75%, var(--color-border) 75%)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
    opacity: 0.35,
} as const

export function ImageDropzone({
    onFileSelect,
    file = null,
    onClear,
    accept = "image/*",
    hint = "PNG, JPG, or WEBP",
    className,
}: ImageDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        if (!file) return

        // Object URLs are an external browser resource that must be created/revoked
        // imperatively — there is no derivable-from-render alternative here.
        const url = URL.createObjectURL(file)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [file])

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

    if (file && previewUrl) {
        return (
            <div className={cn("overflow-hidden rounded-2xl border border-border/60 bg-card", className)}>
                <div className="relative flex items-center justify-center bg-muted/40">
                    <div className="absolute inset-0" style={CHECKERBOARD_STYLE} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={previewUrl}
                        alt={file.name}
                        className="relative max-h-72 w-full object-contain"
                    />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-2.5">
                    <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{file.name}</p>
                        <p className="text-[11px] text-muted-foreground">{formatBytes(file.size)}</p>
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
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="rounded-full"
                                onClick={onClear}
                            >
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
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">Click to upload or drag & drop</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
            {fileInput}
        </div>
    )
}
