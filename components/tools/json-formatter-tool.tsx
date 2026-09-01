"use client"

import { useMemo, useState } from "react"
import { Braces } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/tools/copy-button"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"

type Mode = "pretty" | "minify"

const SAMPLE = '{"name":"Filego","tools":["compress","merge","split"],"active":true,"version":2}'

function process(input: string, mode: Mode, indent: number) {
    if (!input.trim()) return { output: "", error: null as string | null }

    try {
        const parsed = JSON.parse(input)
        return {
            output: mode === "pretty" ? JSON.stringify(parsed, null, indent) : JSON.stringify(parsed),
            error: null,
        }
    } catch (err) {
        return { output: "", error: err instanceof Error ? err.message : "Invalid JSON" }
    }
}

export function JsonFormatterTool() {
    const [input, setInput] = useState(SAMPLE)
    const [mode, setMode] = useState<Mode>("pretty")
    const [indent, setIndent] = useState<"2" | "4" | "tab">("2")

    const { output, error } = useMemo(
        () => process(input, mode, indent === "tab" ? 1 : Number(indent)),
        [input, mode, indent]
    )

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">JSON Formatter</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Format, validate, and minify JSON instantly in your browser.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <ToolSegmentedControl
                    value={mode}
                    onChange={setMode}
                    options={[
                        { value: "pretty", label: "Pretty print" },
                        { value: "minify", label: "Minify" },
                    ]}
                />
                {mode === "pretty" && (
                    <ToolSegmentedControl
                        value={indent}
                        onChange={setIndent}
                        options={[
                            { value: "2", label: "2 spaces" },
                            { value: "4", label: "4 spaces" },
                            { value: "tab", label: "Tab" },
                        ]}
                    />
                )}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <p className="text-sm font-medium">Input</p>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste JSON here"
                        className="min-h-56 rounded-2xl font-mono sm:min-h-72"
                        spellCheck={false}
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Result</p>
                        <CopyButton value={output} label="Copy" variant="ghost" className="sm:w-auto" />
                    </div>
                    <div className="min-h-56 overflow-auto rounded-2xl border border-border/60 bg-muted/30 p-4 sm:min-h-72">
                        {error ? (
                            <p className="text-sm text-destructive">{error}</p>
                        ) : (
                            <pre className="font-mono text-xs whitespace-pre-wrap break-all text-muted-foreground">
                                {output || (
                                    <span className="flex items-center gap-1.5">
                                        <Braces className="h-3.5 w-3.5" />
                                        Formatted JSON will appear here.
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
