"use client"

import { useEffect, useMemo, useState } from "react"
import { removeBackground } from "@imgly/background-removal"
import {
    Download,
    ImageIcon,
    Loader2,
    Palette,
    WandSparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function BackgroundRemoverTool() {
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [resultUrl, setResultUrl] = useState<string | null>(null)
    const [resultFile, setResultFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [progressText, setProgressText] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [backgroundColor, setBackgroundColor] = useState("#ffffff")
    const [showCheckerboard, setShowCheckerboard] = useState(true)

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null)
            return
        }

        const url = URL.createObjectURL(file)
        setPreviewUrl(url)

        return () => URL.revokeObjectURL(url)
    }, [file])

    useEffect(() => {
        return () => {
            if (resultUrl) URL.revokeObjectURL(resultUrl)
        }
    }, [resultUrl])

    const disabled = useMemo(() => !file || loading, [file, loading])

    const handleRemoveBackground = async () => {
        if (!file) return

        try {
            setLoading(true)
            setError(null)
            setProgressText("Preparing model...")
            setResultFile(null)

            if (resultUrl) {
                URL.revokeObjectURL(resultUrl)
                setResultUrl(null)
            }

            const blob = await removeBackground(file, {
                device: "gpu",
                model: "isnet_fp16",
                output: {
                    format: "image/png",
                    quality: 0.9,
                    type: "foreground",
                },
                progress: (key, current, total) => {
                    if (total) {
                        const percent = Math.round((current / total) * 100)
                        setProgressText(`${key}: ${percent}%`)
                    } else {
                        setProgressText(`Downloading ${key}...`)
                    }
                },
            })

            const outputFileName =
                file.name.replace(/\.(png|jpg|jpeg|webp)$/i, "") + "-no-bg.png"

            const outputFile = new File([blob], outputFileName, {
                type: "image/png",
            })

            const url = URL.createObjectURL(blob)

            setResultFile(outputFile)
            setResultUrl(url)
            setProgressText("Background removed successfully.")
        } catch (err) {
            console.error(err)
            setError("Failed to remove background. Try another image or use Chrome desktop.")
            setProgressText("")
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = () => {
        if (!resultUrl || !resultFile) return

        const a = document.createElement("a")
        a.href = resultUrl
        a.download = resultFile.name
        document.body.appendChild(a)
        a.click()
        a.remove()
    }

    const resultPreviewStyle = showCheckerboard
        ? {
            backgroundColor,
            backgroundImage: `
          linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb),
          linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb)
        `,
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px",
        }
        : {
            backgroundColor,
        }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-6">
            <h2 className="text-2xl font-semibold tracking-tight">Background Remover</h2>
            <p className="mt-2 text-muted-foreground">
                Upload an image and remove its background for product, catalog, or creative use.
            </p>

            <div className="mt-6 space-y-4">
                <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                        const selected = e.target.files?.[0] ?? null
                        setFile(selected)
                        setError(null)
                        setProgressText("")
                        setResultFile(null)

                        if (resultUrl) {
                            URL.revokeObjectURL(resultUrl)
                            setResultUrl(null)
                        }
                    }}
                />

                <div className="flex flex-wrap gap-3">
                    <Button
                        className="rounded-full"
                        onClick={handleRemoveBackground}
                        disabled={disabled}
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <WandSparkles className="mr-2 h-4 w-4" />
                        )}
                        {loading ? "Removing..." : "Remove background"}
                    </Button>

                    {resultUrl && resultFile ? (
                        <Button
                            type="button"
                            variant="secondary"
                            className="rounded-full"
                            onClick={handleDownload}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download PNG
                        </Button>
                    ) : null}
                </div>

                {resultUrl ? (
                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-foreground">Preview background</p>
                                <p className="text-sm text-muted-foreground">
                                    Pick a color to test how the transparent PNG looks on different backgrounds.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <label
                                    htmlFor="bg-color"
                                    className="inline-flex items-center gap-2 text-sm text-foreground"
                                >
                                    <Palette className="h-4 w-4" />
                                    Background color
                                </label>

                                <input
                                    id="bg-color"
                                    type="color"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="h-11 w-14 cursor-pointer rounded-xl border border-border bg-background p-1"
                                    aria-label="Choose preview background color"
                                />

                                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                                    <input
                                        type="checkbox"
                                        checked={showCheckerboard}
                                        onChange={(e) => setShowCheckerboard(e.target.checked)}
                                        className="h-4 w-4 rounded border-border"
                                    />
                                    Show checkerboard
                                </label>
                            </div>
                        </div>
                    </div>
                ) : null}

                {file ? (
                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                        Selected file:{" "}
                        <span className="font-medium text-foreground">{file.name}</span>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                        <ImageIcon className="mb-2 h-5 w-5" />
                        Upload PNG, JPG, or WEBP image
                    </div>
                )}

                {progressText ? (
                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                        {progressText}
                    </div>
                ) : null}

                {error ? (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                ) : null}

                {previewUrl || resultUrl ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {previewUrl ? (
                            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                                <p className="mb-3 text-sm font-medium text-foreground">Original</p>
                                <img
                                    src={previewUrl}
                                    alt="Original upload preview"
                                    className="max-h-[360px] w-full rounded-xl object-contain"
                                />
                            </div>
                        ) : null}

                        {resultUrl ? (
                            <div
                                className="rounded-2xl border border-border/60 p-4"
                                style={resultPreviewStyle}
                            >
                                <p className="mb-3 text-sm font-medium text-foreground">Result</p>
                                <div className="flex min-h-[360px] items-center justify-center rounded-xl">
                                    <img
                                        src={resultUrl}
                                        alt="Background removed result"
                                        className="max-h-[360px] w-full object-contain"
                                    />
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    )
}