"use client"

import { useState } from "react"
import Link from "next/link"
import { Download, Loader2, PlayCircle, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CopyButton } from "@/components/tools/copy-button"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"
import type { VideoSummary } from "@/lib/ai/gemini"
import { TRANSLATE_LANGUAGES, findTranslateLanguage } from "@/lib/translate-languages"
import { formatTimestamp, parseYouTubeVideoId, youTubeWatchUrl } from "@/lib/youtube"

type Detail = "short" | "detailed"

type Result = VideoSummary & {
    videoId: string
    title: string
    author: string | null
    thumbnailUrl: string | null
    maxMinutes: number
}

type Status =
    | { kind: "idle" }
    | { kind: "working" }
    | { kind: "error"; message: string }
    | { kind: "auth-required" }
    | { kind: "quota-exceeded"; message: string }

const TOOL_PATH = "/tools/ai-tools/youtube-summarizer"

function toMarkdown(result: Result): string {
    const lines = [
        `# ${result.title}`,
        `${youTubeWatchUrl(result.videoId)}`,
        "",
        "## Summary",
        result.summary,
        "",
        "## Key points",
        ...result.keyPoints.map((point) => `- ${point}`),
    ]
    if (result.chapters.length > 0) {
        lines.push("", "## Chapters")
        for (const chapter of result.chapters) {
            lines.push(
                `- **${formatTimestamp(chapter.startSeconds)}** ${chapter.title}${chapter.summary ? ` – ${chapter.summary}` : ""}`
            )
        }
    }
    return lines.join("\n")
}

function slugify(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "video"
}

export function YouTubeSummarizerTool() {
    const [url, setUrl] = useState("")
    const [detail, setDetail] = useState<Detail>("short")
    const [language, setLanguage] = useState("en")
    const [status, setStatus] = useState<Status>({ kind: "idle" })
    const [result, setResult] = useState<Result | null>(null)
    const [resultLanguage, setResultLanguage] = useState(language)

    const videoId = parseYouTubeVideoId(url)
    const isRtl = Boolean(result && findTranslateLanguage(resultLanguage)?.rtl)
    const isBusy = status.kind === "working"

    async function handleSummarize(event?: React.FormEvent) {
        event?.preventDefault()
        if (!videoId || isBusy) return

        setStatus({ kind: "working" })
        setResult(null)

        try {
            const res = await fetch("/api/ai/youtube-summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ url, detail, language }),
            })
            const data = await res.json().catch(() => null)

            if (res.status === 401) return setStatus({ kind: "auth-required" })
            if (res.status === 429) {
                return setStatus({ kind: "quota-exceeded", message: data?.error || "Daily AI limit reached." })
            }
            if (!res.ok || !data?.ok || !data?.result) {
                return setStatus({ kind: "error", message: data?.error || "AI couldn't summarize this video. Please try again." })
            }

            setResult(data.result as Result)
            setResultLanguage(language)
            setStatus({ kind: "idle" })
        } catch {
            setStatus({ kind: "error", message: "AI couldn't summarize this video. Please try again." })
        }
    }

    function downloadMarkdown() {
        if (!result) return
        const blob = new Blob([toMarkdown(result)], { type: "text/markdown;charset=utf-8" })
        const href = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = href
        a.download = `${slugify(result.title)}-summary.md`
        a.click()
        setTimeout(() => URL.revokeObjectURL(href), 1000)
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">YouTube Video Summarizer</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Paste a YouTube link and get a summary, key points, and clickable chapters, in English, Hindi, or 35+
                other languages.
            </p>

            <form onSubmit={handleSummarize} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">YouTube link</p>
                    <Input
                        type="url"
                        inputMode="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="rounded-full"
                        aria-invalid={url.trim() !== "" && !videoId}
                    />
                    {url.trim() !== "" && !videoId && (
                        <p className="text-xs text-destructive">That doesn&apos;t look like a YouTube video link.</p>
                    )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Length</p>
                        <ToolSegmentedControl
                            value={detail}
                            onChange={setDetail}
                            options={[
                                { value: "short", label: "Quick" },
                                { value: "detailed", label: "Detailed" },
                            ]}
                        />
                    </div>

                    <div className="flex-1 space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Summary language</p>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-full rounded-full sm:w-64">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TRANSLATE_LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.code} value={lang.code}>
                                        {lang.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="submit" className="rounded-full" disabled={!videoId || isBusy}>
                        {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Summarize
                    </Button>
                </div>
            </form>

            {status.kind === "working" && (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Watching the video... long videos can take 1–2 minutes.
                </p>
            )}

            {status.kind === "auth-required" && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                    <Link href={`/login?callbackUrl=${TOOL_PATH}`} className="underline">
                        Sign in
                    </Link>{" "}
                    to summarize videos with AI.
                </p>
            )}

            {status.kind === "quota-exceeded" && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                    {status.message}{" "}
                    <Link href="/dashboard/premium" className="underline">
                        Upgrade for more
                    </Link>
                    .
                </p>
            )}

            {status.kind === "error" && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <p className="text-sm text-destructive">{status.message}</p>
                    <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => handleSummarize()}>
                        Try again
                    </Button>
                </div>
            )}

            {result && !isBusy && (
                <div className="mt-6 space-y-5 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5" dir={isRtl ? "rtl" : "ltr"}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        {result.thumbnailUrl && (
                            <a href={youTubeWatchUrl(result.videoId)} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={result.thumbnailUrl}
                                    alt=""
                                    className="aspect-video w-full rounded-xl object-cover sm:w-44"
                                />
                            </a>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="font-medium leading-snug text-foreground">{result.title}</p>
                            {result.author && <p className="mt-0.5 text-xs text-muted-foreground">{result.author}</p>}
                            <div className="mt-3 flex flex-wrap gap-2" dir="ltr">
                                <CopyButton value={toMarkdown(result)} label="Copy" variant="outline" className="sm:w-auto" />
                                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={downloadMarkdown}>
                                    <Download className="h-4 w-4" />
                                    Download .md
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Summary</p>
                        <p className="mt-2 text-sm leading-6 whitespace-pre-line text-foreground">{result.summary}</p>
                    </div>

                    {result.keyPoints.length > 0 && (
                        <div>
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Key points</p>
                            <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm leading-6 text-foreground">
                                {result.keyPoints.map((point, index) => (
                                    <li key={index}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {result.chapters.length > 0 && (
                        <div>
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Chapters</p>
                            <ol className="mt-2 space-y-2">
                                {result.chapters.map((chapter, index) => (
                                    <li key={index} className="flex gap-3 text-sm leading-6">
                                        <a
                                            href={youTubeWatchUrl(result.videoId, chapter.startSeconds)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-background px-2 font-mono text-xs text-primary hover:underline"
                                            dir="ltr"
                                        >
                                            <PlayCircle className="h-3 w-3" />
                                            {formatTimestamp(chapter.startSeconds)}
                                        </a>
                                        <span className="text-foreground">
                                            <span className="font-medium">{chapter.title}</span>
                                            {chapter.summary && (
                                                <span className="text-muted-foreground"> – {chapter.summary}</span>
                                            )}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                        Videos longer than {result.maxMinutes} minutes are summarized up to that point. AI summaries can contain
                        mistakes.
                    </p>
                </div>
            )}
        </div>
    )
}
