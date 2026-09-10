"use client"

import { useState } from "react"
import type { SevenZipModule } from "7z-wasm"
import { Archive, Download, FileArchive } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { formatBytes } from "@/lib/image-utils"
import { bytesToBlob } from "@/lib/video-tool-utils"
import { downloadBlob, replaceExtension } from "@/lib/pdf-tool-utils"

type ArchiveFormat = "zip" | "tar" | "7z"

// 7-Zip's -t<type> flag for each format we create.
const SEVEN_ZIP_TYPE: Record<ArchiveFormat, string> = {
    zip: "zip",
    tar: "tar",
    "7z": "7z",
}

type ConverterConfig = {
    title: string
    description: string
    accept: string
    hint: string
    sourceExt: ArchiveFormat
    targetExt: ArchiveFormat
}

/** Runs a 7-Zip CLI command, treating a non-zero exit status as a real failure. */
function runSevenZip(sevenZip: SevenZipModule, args: string[]) {
    try {
        sevenZip.callMain(args)
    } catch (err) {
        const status = (err as { status?: number } | undefined)?.status
        if (status !== undefined && status !== 0) {
            throw new Error(`Archive command failed (exit code ${status}).`)
        }
    }
}

export function ArchiveFormatConverterCore({
    title,
    description,
    accept,
    hint,
    sourceExt,
    targetExt,
}: ConverterConfig) {
    const [file, setFile] = useState<File | null>(null)
    const [output, setOutput] = useState<{ blob: Blob; url: string } | null>(null)
    const [isConverting, setIsConverting] = useState(false)
    const [progress, setProgress] = useState("")
    const [error, setError] = useState<string | null>(null)

    function handleFileSelect(next: File) {
        setFile(next)
        setOutput(null)
        setError(null)
    }

    function handleClear() {
        setFile(null)
        setOutput(null)
        setError(null)
    }

    async function handleConvert() {
        if (!file) return
        setIsConverting(true)
        setError(null)
        setOutput(null)

        try {
            setProgress("Loading archive engine...")
            const SevenZip = (await import("7z-wasm")).default
            const sevenZip = await SevenZip({
                locateFile: (path) => (path.endsWith(".wasm") ? "/7zz.wasm" : path),
            })

            setProgress(`Reading ${sourceExt.toUpperCase()} archive...`)
            const bytes = new Uint8Array(await file.arrayBuffer())
            const inputName = `/input.${sourceExt}`
            sevenZip.FS.writeFile(inputName, bytes)
            sevenZip.FS.mkdir("/out")
            runSevenZip(sevenZip, ["x", inputName, "-o/out", "-y"])

            setProgress(`Creating ${targetExt.toUpperCase()} archive...`)
            const outputName = `/output.${targetExt}`
            sevenZip.FS.chdir("/out")
            runSevenZip(sevenZip, ["a", `-t${SEVEN_ZIP_TYPE[targetExt]}`, outputName, "."])
            sevenZip.FS.chdir("/")

            const data = sevenZip.FS.readFile(outputName) as Uint8Array
            const blob = bytesToBlob(data, "application/octet-stream")
            setOutput({ blob, url: URL.createObjectURL(blob) })
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : `Could not convert this ${sourceExt.toUpperCase()} archive.`
            )
        } finally {
            setIsConverting(false)
            setProgress("")
        }
    }

    function handleDownload() {
        if (!output || !file) return
        downloadBlob(output.blob, replaceExtension(file.name, targetExt))
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">{description}</p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <GenericFileDropzone
                        onFileSelect={handleFileSelect}
                        file={file}
                        onClear={handleClear}
                        accept={accept}
                        hint={hint}
                        icon={FileArchive}
                    />

                    {file && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <Button
                                type="button"
                                className="w-full rounded-full"
                                onClick={handleConvert}
                                disabled={isConverting}
                            >
                                <Archive />
                                {isConverting ? "Converting..." : `Convert to ${targetExt.toUpperCase()}`}
                            </Button>

                            {isConverting && (
                                <p className="text-xs text-muted-foreground">{progress || "Working..."}</p>
                            )}
                        </div>
                    )}

                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Result</p>
                    <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-muted/30 p-6">
                        {output ? (
                            <>
                                <div className="flex flex-col items-center gap-2">
                                    <FileArchive className="h-10 w-10 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                        {formatBytes(output.blob.size)}
                                        {file && ` · from ${formatBytes(file.size)}`}
                                    </p>
                                </div>
                                <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload}>
                                    <Download />
                                    Download {targetExt.toUpperCase()}
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <FileArchive className="h-8 w-8" />
                                <p className="text-xs">Converted archive will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ZipToTarTool() {
    return (
        <ArchiveFormatConverterCore
            title="ZIP to TAR"
            description="Convert a ZIP archive into a TAR archive, preserving its file structure."
            accept=".zip,application/zip"
            hint="Click to upload or drag & drop a .zip file"
            sourceExt="zip"
            targetExt="tar"
        />
    )
}

export function TarToZipTool() {
    return (
        <ArchiveFormatConverterCore
            title="TAR to ZIP"
            description="Convert a TAR archive into a widely compatible ZIP archive."
            accept=".tar,application/x-tar"
            hint="Click to upload or drag & drop a .tar file"
            sourceExt="tar"
            targetExt="zip"
        />
    )
}

export function ZipToSevenZipTool() {
    return (
        <ArchiveFormatConverterCore
            title="ZIP to 7Z"
            description="Convert a ZIP archive into a smaller 7Z archive using real 7-Zip compression."
            accept=".zip,application/zip"
            hint="Click to upload or drag & drop a .zip file"
            sourceExt="zip"
            targetExt="7z"
        />
    )
}

export function SevenZipToZipTool() {
    return (
        <ArchiveFormatConverterCore
            title="7Z to ZIP"
            description="Convert a 7Z archive into a widely compatible ZIP archive."
            accept=".7z,application/x-7z-compressed"
            hint="Click to upload or drag & drop a .7z file"
            sourceExt="7z"
            targetExt="zip"
        />
    )
}

export function TarToSevenZipTool() {
    return (
        <ArchiveFormatConverterCore
            title="TAR to 7Z"
            description="Convert a TAR archive into a smaller 7Z archive using real 7-Zip compression."
            accept=".tar,application/x-tar"
            hint="Click to upload or drag & drop a .tar file"
            sourceExt="tar"
            targetExt="7z"
        />
    )
}

export function SevenZipToTarTool() {
    return (
        <ArchiveFormatConverterCore
            title="7Z to TAR"
            description="Convert a 7Z archive into a TAR archive, preserving its file structure."
            accept=".7z,application/x-7z-compressed"
            hint="Click to upload or drag & drop a .7z file"
            sourceExt="7z"
            targetExt="tar"
        />
    )
}
