"use client"

import { useState } from "react"
import { Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function PdfMergeTool() {
    const [files, setFiles] = useState<FileList | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleMerge() {
        if (!files?.length || files.length < 2) return

        try {
            setLoading(true)

            const formData = new FormData()
            Array.from(files).forEach((file) => formData.append("files", file))

            const res = await fetch("/api/tools/pdf-merge", {
                method: "POST",
                body: formData,
            })

            const data = await res.json()
            console.log(data)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-6">
            <h2 className="text-2xl font-semibold tracking-tight">Merge PDF files</h2>
            <p className="mt-2 text-muted-foreground">
                Upload two or more PDF files and combine them into one document.
            </p>

            <div className="mt-6 space-y-4">
                <Input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                />

                <Button onClick={handleMerge} disabled={loading} className="rounded-full">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Merging...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Merge PDFs
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}