"use client"

import { useMemo, useState } from "react"
import Papa from "papaparse"
import { Sheet } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/tools/copy-button"

const SAMPLE = '[{"name":"Filego Guide","price":0,"category":"docs"},{"name":"Getting Started","price":0,"category":"docs"}]'

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key

        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            Object.assign(result, flatten(value as Record<string, unknown>, path))
        } else if (Array.isArray(value)) {
            result[path] = value.join("; ")
        } else {
            result[path] = value
        }
    }

    return result
}

export function JsonToCsvTool() {
    const [input, setInput] = useState(SAMPLE)

    const { output, error } = useMemo(() => {
        if (!input.trim()) return { output: "", error: null as string | null }

        try {
            const parsed = JSON.parse(input)
            const rows = Array.isArray(parsed) ? parsed : [parsed]

            if (rows.length === 0) return { output: "", error: "The JSON array is empty." }
            if (!rows.every((row) => row !== null && typeof row === "object" && !Array.isArray(row))) {
                return { output: "", error: "JSON must be an object or an array of objects." }
            }

            const flatRows = rows.map((row) => flatten(row as Record<string, unknown>))
            return { output: Papa.unparse(flatRows), error: null }
        } catch (err) {
            return { output: "", error: err instanceof Error ? err.message : "Invalid JSON" }
        }
    }, [input])

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">JSON to CSV</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Convert a JSON array of objects into CSV rows, with nested objects flattened.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <p className="text-sm font-medium">JSON input</p>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste a JSON array of objects"
                        className="min-h-56 rounded-2xl font-mono sm:min-h-72"
                        spellCheck={false}
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">CSV output</p>
                        <CopyButton value={output} label="Copy" variant="ghost" className="sm:w-auto" />
                    </div>
                    <div className="min-h-56 overflow-auto rounded-2xl border border-border/60 bg-muted/30 p-4 sm:min-h-72">
                        {error ? (
                            <p className="text-sm text-destructive">{error}</p>
                        ) : (
                            <pre className="font-mono text-xs whitespace-pre text-muted-foreground">
                                {output || (
                                    <span className="flex items-center gap-1.5">
                                        <Sheet className="h-3.5 w-3.5" />
                                        CSV output will appear here.
                                    </span>
                                )}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
