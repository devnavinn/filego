"use client"

import { useMemo, useState } from "react"
import TurndownService from "turndown"
import { FileText } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/tools/copy-button"

const SAMPLE = `<h1>Filego</h1>
<p>A <strong>fast</strong>, browser-based toolkit for everyday file work.</p>
<ul>
  <li>Convert documents</li>
  <li>Compress images</li>
  <li>Merge and split PDFs</li>
</ul>
<p><a href="https://www.filego.in">Learn more</a></p>`

const turndownService = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" })

export function HtmlToMarkdownTool() {
    const [input, setInput] = useState(SAMPLE)

    const { output, error } = useMemo(() => {
        if (!input.trim()) return { output: "", error: null as string | null }

        try {
            return { output: turndownService.turndown(input), error: null }
        } catch (err) {
            return { output: "", error: err instanceof Error ? err.message : "Could not convert this HTML." }
        }
    }, [input])

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">HTML to Markdown</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Convert HTML into clean, readable Markdown.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <p className="text-sm font-medium">HTML input</p>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste HTML here"
                        className="min-h-56 rounded-2xl font-mono sm:min-h-72"
                        spellCheck={false}
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Markdown output</p>
                        <CopyButton value={output} label="Copy" variant="ghost" className="sm:w-auto" />
                    </div>
                    <div className="min-h-56 overflow-auto rounded-2xl border border-border/60 bg-muted/30 p-4 sm:min-h-72">
                        {error ? (
                            <p className="text-sm text-destructive">{error}</p>
                        ) : (
                            <pre className="font-mono text-xs whitespace-pre-wrap break-all text-muted-foreground">
                                {output || (
                                    <span className="flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5" />
                                        Converted Markdown will appear here.
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
