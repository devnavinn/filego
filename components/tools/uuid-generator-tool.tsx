"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CopyButton } from "@/components/tools/copy-button"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"

type Casing = "lower" | "upper"

function generateUuids(count: number, casing: Casing, stripHyphens: boolean) {
    return Array.from({ length: count }, () => {
        let id = crypto.randomUUID()
        if (stripHyphens) id = id.replace(/-/g, "")
        return casing === "upper" ? id.toUpperCase() : id
    })
}

export function UuidGeneratorTool() {
    const [count, setCount] = useState(5)
    const [casing, setCasing] = useState<Casing>("lower")
    const [stripHyphens, setStripHyphens] = useState(false)
    const [ids, setIds] = useState<string[]>([])

    function handleGenerate() {
        const safeCount = Math.min(100, Math.max(1, count))
        setIds(generateUuids(safeCount, casing, stripHyphens))
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">UUID Generator</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Generate RFC 4122 v4 UUIDs in bulk, right in your browser.
            </p>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Count (1-100)</p>
                    <Input
                        type="number"
                        min={1}
                        max={100}
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        className="w-full rounded-full sm:w-24"
                    />
                </div>

                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Casing</p>
                    <ToolSegmentedControl
                        value={casing}
                        onChange={setCasing}
                        options={[
                            { value: "lower", label: "lowercase" },
                            { value: "upper", label: "UPPERCASE" },
                        ]}
                    />
                </div>

                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Hyphens</p>
                    <ToolSegmentedControl
                        value={stripHyphens ? "strip" : "keep"}
                        onChange={(v) => setStripHyphens(v === "strip")}
                        options={[
                            { value: "keep", label: "Keep" },
                            { value: "strip", label: "Remove" },
                        ]}
                    />
                </div>

                <Button type="button" className="w-full rounded-full sm:ml-auto sm:w-auto" onClick={handleGenerate}>
                    <RefreshCw />
                    Generate
                </Button>
            </div>

            <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{ids.length} generated</p>
                    <CopyButton value={ids.join("\n")} label="Copy all" variant="secondary" />
                </div>

                <div className="max-h-96 space-y-2 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 p-3">
                    {ids.length === 0 && (
                        <p className="p-2 text-sm text-muted-foreground">Generated UUIDs will appear here.</p>
                    )}
                    {ids.map((id, i) => (
                        <div
                            key={`${id}-${i}`}
                            className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <code className="overflow-x-auto text-xs break-all">{id}</code>
                            <CopyButton value={id} label="Copy" variant="ghost" className="sm:w-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
