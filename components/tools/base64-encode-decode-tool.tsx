"use client"

import { useMemo, useState } from "react"

import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/tools/copy-button"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"

type Mode = "encode" | "decode"

function encodeBase64(text: string) {
    const bytes = new TextEncoder().encode(text)
    let binary = ""
    bytes.forEach((b) => (binary += String.fromCharCode(b)))
    return btoa(binary)
}

function decodeBase64(text: string) {
    const binary = atob(text)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
}

function process(input: string, mode: Mode) {
    if (!input) return { output: "", error: null as string | null }

    try {
        return { output: mode === "encode" ? encodeBase64(input) : decodeBase64(input), error: null }
    } catch {
        return { output: "", error: mode === "encode" ? "Could not encode this text." : "That doesn't look like valid Base64." }
    }
}

export function Base64EncodeDecodeTool() {
    const [input, setInput] = useState("")
    const [mode, setMode] = useState<Mode>("encode")

    const { output, error } = useMemo(() => process(input, mode), [input, mode])

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Base64 Encode / Decode</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Encode or decode Base64 text instantly, right in your browser.
            </p>

            <div className="mt-6">
                <ToolSegmentedControl
                    value={mode}
                    onChange={setMode}
                    options={[
                        { value: "encode", label: "Encode" },
                        { value: "decode", label: "Decode" },
                    ]}
                />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <p className="text-sm font-medium">Input</p>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={mode === "encode" ? "Text to encode" : "Base64 to decode"}
                        className="min-h-40 rounded-2xl sm:min-h-56"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Result</p>
                        <CopyButton value={output} label="Copy" variant="ghost" className="sm:w-auto" />
                    </div>
                    <div className="min-h-40 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:min-h-56">
                        {error ? (
                            <p className="text-sm text-destructive">{error}</p>
                        ) : (
                            <pre className="overflow-x-auto break-all whitespace-pre-wrap text-xs text-muted-foreground">
                                {output || "Your converted value will appear here."}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
