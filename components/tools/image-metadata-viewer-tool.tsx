"use client"

import { useState } from "react"
import { parse } from "exifr"
import { FileImage, MapPin } from "lucide-react"

import { ImageDropzone } from "@/components/tools/image-dropzone"
import { CopyButton } from "@/components/tools/copy-button"
import { formatBytes } from "@/lib/image-utils"
import { loadImageElement } from "@/lib/image-tool-utils"

type BasicInfo = {
    name: string
    type: string
    size: number
    width: number
    height: number
}

type MetadataEntry = { label: string; value: string }

function formatValue(value: unknown): string {
    if (value instanceof Date) return value.toLocaleString()
    if (value instanceof Uint8Array) return `[${value.length} bytes]`
    if (Array.isArray(value)) {
        return value.length > 8 ? `[${value.length} values]` : value.join(", ")
    }
    if (typeof value === "number") return String(Math.round(value * 1000) / 1000)
    return String(value)
}

function toEntries(metadata: Record<string, unknown> | undefined): MetadataEntry[] {
    if (!metadata) return []
    return Object.entries(metadata)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => ({ label: key, value: formatValue(value) }))
        .sort((a, b) => a.label.localeCompare(b.label))
}

export function ImageMetadataViewerTool() {
    const [file, setFile] = useState<File | null>(null)
    const [basicInfo, setBasicInfo] = useState<BasicInfo | null>(null)
    const [entries, setEntries] = useState<MetadataEntry[]>([])
    const [gps, setGps] = useState<{ latitude: number; longitude: number } | null>(null)
    const [rawJson, setRawJson] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    async function handleFileSelect(file: File) {
        setFile(file)
        setError(null)
        setIsLoading(true)
        setEntries([])
        setGps(null)

        try {
            const loaded = await loadImageElement(file)
            setBasicInfo({
                name: file.name,
                type: file.type || "unknown",
                size: file.size,
                width: loaded.width,
                height: loaded.height,
            })
            URL.revokeObjectURL(loaded.url)

            const metadata = await parse(file, {
                tiff: true,
                exif: true,
                gps: true,
                iptc: true,
                xmp: true,
                icc: false,
            }).catch(() => undefined)

            if (metadata) {
                setEntries(toEntries(metadata))
                setRawJson(JSON.stringify(metadata, null, 2))
                if (typeof metadata.latitude === "number" && typeof metadata.longitude === "number") {
                    setGps({ latitude: metadata.latitude, longitude: metadata.longitude })
                }
            } else {
                setRawJson("")
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read this image.")
        } finally {
            setIsLoading(false)
        }
    }

    function handleClear() {
        setFile(null)
        setBasicInfo(null)
        setEntries([])
        setGps(null)
        setRawJson("")
        setError(null)
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Image Metadata Viewer</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Inspect EXIF, GPS, and other embedded metadata from an image — all in your browser.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <ImageDropzone
                        onFileSelect={handleFileSelect}
                        file={file}
                        onClear={file ? handleClear : undefined}
                        hint="JPG, PNG, WEBP, or HEIC"
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}

                    {basicInfo && (
                        <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <p className="flex items-center gap-2 text-sm font-medium">
                                <FileImage className="h-4 w-4" />
                                File info
                            </p>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <dt>Type</dt>
                                <dd className="text-foreground">{basicInfo.type}</dd>
                                <dt>Size</dt>
                                <dd className="text-foreground">{formatBytes(basicInfo.size)}</dd>
                                <dt>Dimensions</dt>
                                <dd className="text-foreground">
                                    {basicInfo.width} x {basicInfo.height} px
                                </dd>
                            </dl>
                        </div>
                    )}

                    {gps && (
                        <a
                            href={`https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm transition-colors hover:bg-muted/50"
                        >
                            <MapPin className="h-4 w-4 shrink-0 text-teal-500" />
                            <span>
                                GPS location found — {gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)} (open in Maps)
                            </span>
                        </a>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Metadata</p>
                        {rawJson && <CopyButton value={rawJson} label="Copy JSON" variant="ghost" className="sm:w-auto" />}
                    </div>

                    <div className="min-h-56 max-h-96 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 p-4">
                        {isLoading && <p className="text-sm text-muted-foreground">Reading metadata...</p>}

                        {!isLoading && !basicInfo && (
                            <p className="text-sm text-muted-foreground">Upload an image to inspect its metadata.</p>
                        )}

                        {!isLoading && basicInfo && entries.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No EXIF, IPTC, or XMP metadata was found in this image.
                            </p>
                        )}

                        {entries.length > 0 && (
                            <div className="space-y-1.5">
                                {entries.map((entry) => (
                                    <div
                                        key={entry.label}
                                        className="flex items-start justify-between gap-3 border-b border-border/50 pb-1.5 text-xs last:border-0"
                                    >
                                        <span className="shrink-0 font-medium text-muted-foreground">{entry.label}</span>
                                        <span className="break-all text-right text-foreground">{entry.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
