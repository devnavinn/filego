"use client"

import { useState } from "react"
import TurndownService from "turndown"
import { Download, FileText, Globe, Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/tools/copy-button"

const turndownService = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" })

function extractBodyHtml(html: string): string {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
    const content = bodyMatch ? bodyMatch[1] : html

    return content
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
}

export function WebsiteToMarkdownTool() {
    const [url, setUrl] = useState("")
    const [output, setOutput] = useState("")
    const [title, setTitle] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleConvert() {
        if (!url.trim() || loading) return

        setLoading(true)
        setError(null)
        setOutput("")
        setTitle(null)

        try {
            const res = await fetch("/api/tools/website-to-markdown", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: url.trim() }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error ?? "Could not convert this page.")
                return
            }

            const markdown = turndownService.turndown(extractBodyHtml(data.html))
            setOutput(markdown.trim())
            setTitle(data.title ?? null)
        } catch {
            setError("Something went wrong while converting this page.")
        } finally {
            setLoading(false)
        }
    }

    function handleDownload() {
        if (!output) return

        const slug =
            (title || url)
                .toLowerCase()
                .replace(/^https?:\/\//, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "")
                .slice(0, 60) || "page"

        const blob = new Blob([output], { type: "text/markdown;charset=utf-8" })
        const objectUrl = URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = objectUrl
        link.download = `${slug}.md`
        link.click()

        URL.revokeObjectURL(objectUrl)
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Website to Markdown</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Fetch a web page and convert it into clean, readable Markdown.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Globe className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleConvert()
                        }}
                        placeholder="https://example.com/article"
                        className="pl-8"
                        inputMode="url"
                        spellCheck={false}
                    />
                </div>
                <Button
                    type="button"
                    onClick={handleConvert}
                    disabled={loading || !url.trim()}
                    className="rounded-full sm:w-auto"
                >
                    {loading ? <Loader2 className="animate-spin" /> : null}
                    {loading ? "Converting..." : "Convert"}
                </Button>
            </div>

            <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium">
                        Markdown output
                        {title ? <span className="ml-1.5 font-normal text-muted-foreground">— {title}</span> : null}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleDownload}
                            disabled={!output}
                            className="rounded-full sm:w-auto"
                        >
                            <Download />
                            Download .md
                        </Button>
                        <CopyButton value={output} label="Copy" variant="ghost" className="sm:w-auto" />
                    </div>
                </div>
                <div className="min-h-56 overflow-auto rounded-2xl border border-border/60 bg-muted/30 p-4 sm:min-h-72">
                    {error ? (
                        <p className="text-sm text-destructive">{error}</p>
                    ) : (
                        <pre className="font-mono text-xs whitespace-pre-wrap break-all text-muted-foreground">
                            {output || (
                                <span className="flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5" />
                                    Enter a URL above to fetch and convert its content.
                                </span>
                            )}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    )
}
