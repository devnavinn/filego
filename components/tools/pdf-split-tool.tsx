"use client"

import { useState } from "react"
import { Scissors } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function PdfSplitTool() {
    const [file, setFile] = useState<File | null>(null)
    const [range, setRange] = useState("1-2")

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-6">
            <h2 className="text-2xl font-semibold tracking-tight">Split PDF</h2>
            <p className="mt-2 text-muted-foreground">
                Upload a PDF and choose page ranges to split into separate output files.
            </p>

            <div className="mt-6 space-y-4">
                <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <Input
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    placeholder="Example: 1-2, 3-5"
                />
                <Button className="rounded-full">
                    <Scissors className="mr-2 h-4 w-4" />
                    Split PDF
                </Button>
            </div>
        </div>
    )
}