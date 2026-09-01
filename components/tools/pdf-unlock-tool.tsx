"use client"

import { useState } from "react"
import { PDFDocument } from "@cantoo/pdf-lib"
import { Eye, EyeOff, ShieldCheck, Unlock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PdfDropzone } from "@/components/tools/pdf-dropzone"
import { downloadBlob, pdfBytesToBlob, replaceExtension } from "@/lib/pdf-tool-utils"

export function PdfUnlockTool() {
    const [file, setFile] = useState<File | null>(null)
    const [isEncrypted, setIsEncrypted] = useState<boolean | null>(null)
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isChecking, setIsChecking] = useState(false)
    const [isUnlocking, setIsUnlocking] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setIsEncrypted(null)
        setPassword("")
        setError(null)
    }

    async function handleFileSelect(next: File) {
        setFile(next)
        setPassword("")
        setError(null)
        setIsChecking(true)

        try {
            const bytes = await next.arrayBuffer()
            const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
            setIsEncrypted(doc.isEncrypted)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read this PDF.")
        } finally {
            setIsChecking(false)
        }
    }

    async function handleUnlock() {
        if (!file) return
        setIsUnlocking(true)
        setError(null)

        try {
            const bytes = await file.arrayBuffer()
            const doc = await PDFDocument.load(bytes, { password })
            const output = await doc.save()
            downloadBlob(pdfBytesToBlob(output), replaceExtension(file.name, "pdf"))
        } catch {
            setError("Incorrect password. Try again.")
        } finally {
            setIsUnlocking(false)
        }
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">PDF Unlock</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Remove password protection from a PDF you already have the password for.
            </p>

            <div className="mt-6 space-y-4">
                <PdfDropzone onFileSelect={handleFileSelect} file={file} onClear={handleClear} />

                {isChecking && <p className="text-sm text-muted-foreground">Checking this PDF...</p>}

                {file && !isChecking && isEncrypted === false && (
                    <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-teal-500" />
                        This PDF isn&apos;t password protected — nothing to unlock.
                    </div>
                )}

                {file && !isChecking && isEncrypted && (
                    <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Current password</p>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter the PDF's password"
                                    className="h-9 rounded-xl pr-9"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button type="button" className="w-full rounded-full" onClick={handleUnlock} disabled={isUnlocking}>
                            <Unlock />
                            {isUnlocking ? "Unlocking..." : "Unlock PDF"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
