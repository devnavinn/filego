"use client"

import { useMemo, useState } from "react"
import { marked } from "marked"
import DOMPurify from "dompurify"

import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/tools/copy-button"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"

const SAMPLE = `# Filego

A **fast**, browser-based toolkit for everyday file work.

- Convert documents
- Compress images
- Merge and split PDFs

[Learn more](https://www.filego.in)
`

type View = "preview" | "html"

marked.setOptions({ gfm: true, breaks: true })

export function MarkdownToHtmlTool() {
    const [input, setInput] = useState(SAMPLE)
    const [view, setView] = useState<View>("preview")

    const { html, sanitized } = useMemo(() => {
        const raw = marked.parse(input, { async: false }) as string
        const sanitized = typeof window === "undefined" ? "" : DOMPurify.sanitize(raw)
        return { html: raw, sanitized }
    }, [input])

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Markdown to HTML</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Convert Markdown into HTML with a live preview, right in your browser.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <p className="text-sm font-medium">Markdown</p>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Write or paste Markdown here"
                        className="min-h-56 rounded-2xl font-mono sm:min-h-72"
                        spellCheck={false}
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <ToolSegmentedControl
                            value={view}
                            onChange={setView}
                            options={[
                                { value: "preview", label: "Preview" },
                                { value: "html", label: "HTML source" },
                            ]}
                        />
                        <CopyButton value={html} label="Copy HTML" variant="ghost" className="sm:w-auto" />
                    </div>

                    <div className="min-h-56 overflow-auto rounded-2xl border border-border/60 bg-muted/30 p-4 sm:min-h-72">
                        {view === "preview" ? (
                            <div
                                className="max-w-none text-sm leading-6 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-background [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_h1]:mt-4 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:first:mt-0 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_hr]:my-4 [&_hr]:border-border [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-background [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5"
                                dangerouslySetInnerHTML={{ __html: sanitized }}
                            />
                        ) : (
                            <pre className="font-mono text-xs whitespace-pre-wrap break-all text-muted-foreground">
                                {html}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
