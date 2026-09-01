"use client"

import { useRef, useState } from "react"
import { FileText, RefreshCw, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/image-utils"
import { cn } from "@/lib/utils"

type PdfDropzoneProps = {
    onFileSelect: (file: File) => void
    file?: File | null
    onClear?: () => void
    hint?: string
    className?: string
}

export function PdfDropzone({
    onFileSelect,
    file = null,
    onClear,
    hint = "PDF files only",
    className,
}: PdfDropzoneProps) {
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
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
                handleFiles(e.target.files)
                e.target.value = ""
            }}
        />
    )

    if (file) {
        return (
            <div
                className={cn(
                    "flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3",
                    className
                )}
            >
                <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-xl bg-muted p-2.5">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                    </div>
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
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">Click to upload or drag & drop</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
            {fileInput}
        </div>
    )
}
