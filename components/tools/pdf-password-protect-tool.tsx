"use client"

import { useState } from "react"
import { PDFDocument } from "@cantoo/pdf-lib"
import { Eye, EyeOff, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PdfDropzone } from "@/components/tools/pdf-dropzone"
import { downloadBlob, pdfBytesToBlob, replaceExtension } from "@/lib/pdf-tool-utils"

export function PdfPasswordProtectTool() {
    const [file, setFile] = useState<File | null>(null)
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [restrict, setRestrict] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setError(null)
    }

    async function handleSave() {
        if (!file || password.length < 4) return
        setIsSaving(true)
        setError(null)

        try {
            const bytes = await file.arrayBuffer()
            const doc = await PDFDocument.load(bytes)

            doc.encrypt({
                userPassword: password,
                ownerPassword: password,
                permissions: restrict
                    ? { printing: "lowResolution", copying: false, modifying: false }
                    : undefined,
            })

            const output = await doc.save()
            downloadBlob(pdfBytesToBlob(output), replaceExtension(file.name, "pdf"))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not protect this PDF.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">PDF Password Protect</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Encrypt your PDF with a password using AES-256 — nobody can open it without the password.
            </p>

            <div className="mt-6 space-y-4">
                <PdfDropzone onFileSelect={setFile} file={file} onClear={handleClear} />

                {file && (
                    <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Password (min. 4 characters)</p>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Choose a password"
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

                        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <input
                                type="checkbox"
                                checked={restrict}
                                onChange={(e) => setRestrict(e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-border"
                            />
                            Also restrict printing, copying, and editing
                        </label>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button
                            type="button"
                            className="w-full rounded-full"
                            onClick={handleSave}
                            disabled={isSaving || password.length < 4}
                        >
                            <Lock />
                            {isSaving ? "Encrypting..." : "Protect PDF"}
                        </Button>

                        <p className="text-xs text-muted-foreground">
                            This password can&apos;t be recovered if you lose it — store it somewhere safe.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
