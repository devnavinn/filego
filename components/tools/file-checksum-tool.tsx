"use client"

import { useState } from "react"
import { md5 } from "js-md5"
import { FileDigit } from "lucide-react"

import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { CopyButton } from "@/components/tools/copy-button"

const ALGORITHMS = ["MD5", "SHA-1", "SHA-256", "SHA-512"] as const

function toHex(buffer: ArrayBuffer) {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
}

export function FileChecksumTool() {
    const [file, setFile] = useState<File | null>(null)
    const [hashes, setHashes] = useState<Record<string, string>>({})
    const [isHashing, setIsHashing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setHashes({})
        setError(null)
    }

    async function handleFileSelect(next: File) {
        setFile(next)
        setError(null)
        setIsHashing(true)
        setHashes({})

        try {
            const buffer = await next.arrayBuffer()
            const results: Record<string, string> = { MD5: md5(buffer) }

            for (const algo of ["SHA-1", "SHA-256", "SHA-512"] as const) {
                const digest = await crypto.subtle.digest(algo, buffer)
                results[algo] = toHex(digest)
            }

            setHashes(results)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not hash this file.")
        } finally {
            setIsHashing(false)
        }
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">File Checksum Generator</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Generate checksums for any file to verify its integrity — nothing leaves your browser.
            </p>

            <div className="mt-6 space-y-4">
                <GenericFileDropzone
                    onFileSelect={handleFileSelect}
                    file={file}
                    onClear={handleClear}
                    icon={FileDigit}
                    hint="Click to upload or drag & drop any file"
                />

                {isHashing && <p className="text-sm text-muted-foreground">Hashing file...</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}

                {!isHashing && Object.keys(hashes).length > 0 && (
                    <div className="space-y-2">
                        {ALGORITHMS.map((algo) => (
                            <div
                                key={algo}
                                className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <p className="text-xs font-medium text-muted-foreground">{algo}</p>
                                <div className="flex items-center justify-between gap-2">
                                    <code className="overflow-x-auto text-xs break-all">{hashes[algo]}</code>
                                    <CopyButton value={hashes[algo]} label="" variant="ghost" className="w-auto shrink-0 px-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
