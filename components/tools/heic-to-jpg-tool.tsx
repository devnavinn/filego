"use client"

import { useRef, useState } from "react"
import JSZip from "jszip"
import { Download, ImagePlus, Loader2, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob } from "@/lib/image-tool-utils"
import { cn } from "@/lib/utils"

type ConvertedFile = {
    id: string
    name: string
    originalSize: number
    status: "pending" | "converting" | "done" | "error"
    resultBlob?: Blob
    resultUrl?: string
    error?: string
}

const ACCEPT = ".heic,.heif,image/heic,image/heif"

function outputName(name: string) {
    return name.replace(/\.(heic|heif)$/i, "") + ".jpg"
}

export function HeicToJpgTool() {
    const [items, setItems] = useState<ConvertedFile[]>([])
    const [quality, setQuality] = useState(90)
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)

    async function convertOne(id: string, file: File) {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: "converting" } : item)))

        try {
            const heic2any = (await import("heic2any")).default
            const result = await heic2any({ blob: file, toType: "image/jpeg", quality: quality / 100 })
            const blob = Array.isArray(result) ? result[0] : result
            const url = URL.createObjectURL(blob)

            setItems((prev) =>
                prev.map((item) => (item.id === id ? { ...item, status: "done", resultBlob: blob, resultUrl: url } : item))
            )
        } catch (err) {
            setItems((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? {
                              ...item,
                              status: "error",
                              error: err instanceof Error ? err.message : "Could not convert this file.",
                          }
                        : item
                )
            )
        }
    }

    function handleFiles(fileList: FileList | null) {
        const files = Array.from(fileList ?? [])
        if (files.length === 0) return

        const newItems: ConvertedFile[] = files.map((file) => ({
            id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
            name: file.name,
            originalSize: file.size,
            status: "pending",
        }))

        setItems((prev) => [...prev, ...newItems])

        newItems.forEach((item, index) => {
            void convertOne(item.id, files[index])
        })
    }

    function handleRemove(id: string) {
        setItems((prev) => {
            const target = prev.find((item) => item.id === id)
            if (target?.resultUrl) URL.revokeObjectURL(target.resultUrl)
            return prev.filter((item) => item.id !== id)
        })
    }

    function handleClearAll() {
        items.forEach((item) => {
            if (item.resultUrl) URL.revokeObjectURL(item.resultUrl)
        })
        setItems([])
        if (inputRef.current) inputRef.current.value = ""
    }

    function handleDownloadOne(item: ConvertedFile) {
        if (!item.resultBlob) return
        downloadBlob(item.resultBlob, outputName(item.name))
    }

    async function handleDownloadAll() {
        const done = items.filter((item) => item.status === "done" && item.resultBlob)
        if (done.length === 0) return

        const zip = new JSZip()
        done.forEach((item) => {
            zip.file(outputName(item.name), item.resultBlob as Blob)
        })

        const blob = await zip.generateAsync({ type: "blob" })
        downloadBlob(blob, "converted-images.zip")
    }

    const doneCount = items.filter((item) => item.status === "done").length
    const isBusy = items.some((item) => item.status === "converting")

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">HEIC to JPG</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Convert iPhone HEIC/HEIF photos into widely compatible JPG images — upload one or many at once.
            </p>

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
                    "mt-6 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center transition-colors sm:p-10",
                    isDragging ? "border-primary bg-primary/5" : "border-border/60 bg-muted/30 hover:bg-muted/50"
                )}
            >
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload or drag & drop HEIC/HEIF photos</p>
                <p className="text-xs text-muted-foreground">You can select multiple files at once</p>
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                        handleFiles(e.target.files)
                        e.target.value = ""
                    }}
                />
            </div>

            {items.length > 0 && (
                <>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-40 flex-1 items-center gap-3">
                            <span className="text-xs whitespace-nowrap text-muted-foreground">Quality</span>
                            <Slider
                                value={[quality]}
                                onValueChange={([value]) => setQuality(value)}
                                min={50}
                                max={100}
                                step={5}
                                className="max-w-40"
                            />
                            <span className="w-9 text-xs text-muted-foreground">{quality}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                onClick={handleDownloadAll}
                                disabled={doneCount === 0}
                            >
                                <Download className="h-3.5 w-3.5" />
                                Download all ({doneCount})
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={handleClearAll} disabled={isBusy}>
                                <Trash2 className="h-3.5 w-3.5" />
                                Clear
                            </Button>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-3"
                            >
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background">
                                    {item.resultUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.resultUrl} alt={item.name} className="h-full w-full object-cover" />
                                    ) : item.status === "converting" ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    ) : (
                                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium">{item.name}</p>
                                    {item.status === "error" ? (
                                        <p className="truncate text-[11px] text-destructive">{item.error}</p>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground">
                                            {formatBytes(item.originalSize)}
                                            {item.resultBlob ? ` → ${formatBytes(item.resultBlob.size)}` : ""}
                                        </p>
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    {item.status === "done" && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="rounded-full"
                                            onClick={() => handleDownloadOne(item)}
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="rounded-full"
                                        onClick={() => handleRemove(item.id)}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
