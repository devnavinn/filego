"use client"

import { useMemo, useState } from "react"
import { Braces } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/tools/copy-button"

const SAMPLE = "<catalog><book id=\"1\"><title>Filego Guide</title><price>0</price></book><book id=\"2\"><title>Getting Started</title><price>0</price></book></catalog>"

type JsonNode = string | { [key: string]: unknown }

function elementToJson(element: Element): JsonNode {
    const result: Record<string, unknown> = {}

    for (const attr of Array.from(element.attributes)) {
        result[`@${attr.name}`] = attr.value
    }

    const childElements = Array.from(element.children)

    if (childElements.length === 0) {
        const text = element.textContent?.trim() ?? ""
        if (Object.keys(result).length === 0) return text
        if (text) result["#text"] = text
        return result
    }

    for (const child of childElements) {
        const childValue = elementToJson(child)
        const existing = result[child.tagName]

        if (existing === undefined) {
            result[child.tagName] = childValue
        } else if (Array.isArray(existing)) {
            existing.push(childValue)
        } else {
            result[child.tagName] = [existing, childValue]
        }
    }

    return result
}

export function XmlToJsonTool() {
    const [input, setInput] = useState(SAMPLE)

    const { output, error } = useMemo(() => {
        if (!input.trim()) return { output: "", error: null as string | null }
        if (typeof window === "undefined") return { output: "", error: null as string | null }

        const doc = new DOMParser().parseFromString(input, "application/xml")
        const parseError = doc.querySelector("parsererror")
        if (parseError) return { output: "", error: parseError.textContent?.trim() ?? "Invalid XML" }

        try {
            const root = doc.documentElement
            const json = { [root.tagName]: elementToJson(root) }
            return { output: JSON.stringify(json, null, 2), error: null }
        } catch (err) {
            return { output: "", error: err instanceof Error ? err.message : "Could not convert this XML." }
        }
    }, [input])

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">XML to JSON</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Convert XML data into JSON format, right in your browser.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <p className="text-sm font-medium">XML input</p>
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
                        <p className="text-sm font-medium">JSON output</p>
                        <CopyButton value={output} label="Copy" variant="ghost" className="sm:w-auto" />
                    </div>
                    <div className="min-h-56 overflow-auto rounded-2xl border border-border/60 bg-muted/30 p-4 sm:min-h-72">
                        {error ? (
                            <p className="text-sm text-destructive">{error}</p>
                        ) : (
                            <pre className="font-mono text-xs whitespace-pre text-muted-foreground">
                                {output || (
                                    <span className="flex items-center gap-1.5">
                                        <Braces className="h-3.5 w-3.5" />
                                        Converted JSON will appear here.
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
