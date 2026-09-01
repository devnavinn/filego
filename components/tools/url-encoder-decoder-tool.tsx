"use client"

import { useMemo, useState } from "react"
import { ArrowLeftRight, Link2 } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/tools/copy-button"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"

type Mode = "encode" | "decode"
type Scope = "component" | "full"

function convert(input: string, mode: Mode, scope: Scope) {
    if (!input) return { output: "", error: null as string | null }

    try {
        if (mode === "encode") {
            return {
                output: scope === "component" ? encodeURIComponent(input) : encodeURI(input),
                error: null,
            }
        }

        return {
            output: scope === "component" ? decodeURIComponent(input) : decodeURI(input),
            error: null,
        }
    } catch {
        return { output: "", error: "That doesn't look like a valid encoded value." }
    }
}

export function UrlEncoderDecoderTool() {
    const [input, setInput] = useState("")
    const [mode, setMode] = useState<Mode>("encode")
    const [scope, setScope] = useState<Scope>("component")

    const { output, error } = useMemo(() => convert(input, mode, scope), [input, mode, scope])

    function handleSwap() {
        setMode((prev) => (prev === "encode" ? "decode" : "encode"))
        setInput(output)
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">URL Encoder / Decoder</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Encode or decode URLs and query values instantly, right in your browser.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <ToolSegmentedControl
                    value={mode}
                    onChange={setMode}
                    options={[
                        { value: "encode", label: "Encode" },
                        { value: "decode", label: "Decode" },
                    ]}
                />
                <ToolSegmentedControl
                    value={scope}
                    onChange={setScope}
                    options={[
                        { value: "component", label: "Component" },
                        { value: "full", label: "Full URI" },
                    ]}
                />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <p className="text-sm font-medium">Input</p>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste a URL or text to encode/decode"
                        className="min-h-40 rounded-2xl sm:min-h-56"
                    />
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Result</p>
                    <div className="min-h-40 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:min-h-56">
                        <pre className="overflow-x-auto break-all whitespace-pre-wrap text-xs text-muted-foreground">
                            {error ?? output ?? "Your converted value will appear here."}
                        </pre>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                    type="button"
                    variant="secondary"
                    className="w-full rounded-full sm:w-auto"
                    onClick={handleSwap}
                    disabled={!output || !!error}
                >
                    <ArrowLeftRight />
                    Swap & convert result
                </Button>
                <CopyButton value={output} label="Copy result" />
            </div>

            {input && !error && !output && mode === "decode" && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Link2 className="h-3.5 w-3.5" />
                    Nothing to decode in that value.
                </p>
            )}
        </div>
    )
}
