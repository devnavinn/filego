"use client"

import { useMemo, useState } from "react"
import { FileCode2 } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/tools/copy-button"

const SAMPLE = "<catalog><book id=\"1\"><title>Filego Guide</title><price>0</price></book><book id=\"2\"><title>Getting Started</title><price>0</price></book></catalog>"

function validateXml(xml: string): string | null {
    const doc = new DOMParser().parseFromString(xml, "application/xml")
    const parseError = doc.querySelector("parsererror")
    return parseError ? parseError.textContent?.trim() ?? "Invalid XML" : null
}

function formatXml(xml: string, indentSize: number): string {
    const padding = " ".repeat(indentSize)
    const withBreaks = xml.trim().replace(/>\s*</g, ">\n<")
    let depth = 0

    return withBreaks
        .split("\n")
        .map((line) => {
            const trimmed = line.trim()
            let currentDepth = depth

            const isClosingTag = /^<\/[^>]+>/.test(trimmed)
            const isSelfClosing = /\/>$/.test(trimmed) || /^<\?/.test(trimmed) || /^<!--.*-->$/.test(trimmed)
            const isOpeningTag = /^<[^/!?][^>]*[^/]>$/.test(trimmed) && !isSelfClosing

            if (isClosingTag) {
                depth = Math.max(0, depth - 1)
                currentDepth = depth
            } else if (isOpeningTag) {
                depth += 1
            }

            return padding.repeat(currentDepth) + trimmed
        })
        .join("\n")
}

export function XmlFormatterTool() {
    const [input, setInput] = useState(SAMPLE)

    const { output, error } = useMemo(() => {
        if (!input.trim()) return { output: "", error: null as string | null }
        if (typeof window === "undefined") return { output: "", error: null as string | null }

        const validationError = validateXml(input)
        if (validationError) return { output: "", error: validationError }

        try {
            return { output: formatXml(input, 2), error: null }
        } catch (err) {
            return { output: "", error: err instanceof Error ? err.message : "Could not format this XML." }
        }
    }, [input])

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">XML Formatter</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Format and validate XML content with proper indentation.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <p className="text-sm font-medium">Input</p>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste XML here"
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
                            <pre className="font-mono text-xs whitespace-pre text-muted-foreground">
                                {output || (
                                    <span className="flex items-center gap-1.5">
                                        <FileCode2 className="h-3.5 w-3.5" />
                                        Formatted XML will appear here.
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
