"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { fetchFile } from "@ffmpeg/util"
import { Captions, ChevronDown, Download, Loader2, Minus, Plus, RefreshCw, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CopyButton } from "@/components/tools/copy-button"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"
import { VideoDropzone } from "@/components/tools/video-dropzone"
import { usePlan } from "@/hooks/use-plan"
import { fileToBase64 } from "@/lib/file-to-base64"
import { downloadBlob, replaceExtension } from "@/lib/pdf-tool-utils"
import {
    SUBTITLE_MINUTE_LIMITS,
    chooseCutPoints,
    formatCueTime,
    parseClock,
    parseSilenceLog,
    shiftCues,
    toPlainText,
    toSrt,
    toVtt,
    type SubtitleCue,
    type SubtitleStyle,
} from "@/lib/subtitles"
import { TRANSLATE_LANGUAGES, findTranslateLanguage } from "@/lib/translate-languages"
import { useFFmpeg } from "@/lib/use-ffmpeg"
import { bytesToBlob, formatDuration, getVideoMeta, type VideoMeta } from "@/lib/video-tool-utils"

type Status =
    | { kind: "idle" }
    | { kind: "extracting" }
    | { kind: "transcribing"; done: number; total: number }
    | { kind: "error"; message: string }
    | { kind: "auth-required" }
    | { kind: "quota-exceeded"; message: string }

/** One ~5 minute slice of the extracted audio, kept so failed parts can be retried without re-extracting. */
type AudioPart = { start: number; duration: number; base64: string }

type Job = {
    parts: AudioPart[]
    totalSeconds: number
    token: string | null
    style: SubtitleStyle
    language: string
    /** Cues per part (absolute times), or null if that part hasn't succeeded yet. */
    results: (SubtitleCue[] | null)[]
}

const TOOL_PATH = "/tools/ai-tools/subtitle-generator"
const PART_CONCURRENCY = 3

class PartError extends Error {
    constructor(message: string, readonly status: number) {
        super(message)
    }
}

async function requestPart(job: Job, index: number): Promise<{ cues: SubtitleCue[]; token: string | null }> {
    const part = job.parts[index]
    const res = await fetch("/api/ai/subtitles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
            part: index,
            partCount: job.parts.length,
            durationSeconds: part.duration,
            totalSeconds: job.totalSeconds,
            audioBase64: part.base64,
            style: job.style,
            language: job.language,
            token: job.token,
        }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok || !Array.isArray(data?.cues)) {
        throw new PartError(data?.error || "AI couldn't create subtitles. Please try again.", res.status)
    }
    const cues = (data.cues as SubtitleCue[]).map((cue) => ({
        start: cue.start + part.start,
        end: cue.end + part.start,
        text: cue.text,
    }))
    return { cues, token: typeof data.token === "string" ? data.token : null }
}

/** Retries a part once on server/network errors; auth, quota, and validation errors are final. */
async function requestPartWithRetry(job: Job, index: number) {
    try {
        return await requestPart(job, index)
    } catch (error) {
        if (error instanceof PartError && error.status > 0 && error.status < 500) throw error
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return requestPart(job, index)
    }
}

/** Joins parts, keeping cues ordered and trimming any overlap at the seams between parts. */
function mergeResults(results: (SubtitleCue[] | null)[]): SubtitleCue[] {
    const cues = results.flatMap((r) => r ?? []).sort((a, b) => a.start - b.start)
    for (let i = 0; i < cues.length - 1; i++) {
        if (cues[i].end > cues[i + 1].start) cues[i] = { ...cues[i], end: Math.max(cues[i].start + 0.2, cues[i + 1].start) }
    }
    return cues
}

/** Duration from ffmpeg's log ("Duration: 00:03:21.45"), for files whose metadata the browser can't read (some WebM). */
function durationFromLog(lines: string[]): number | null {
    for (const line of lines) {
        const match = /Duration:\s*(\d+:\d{2}:\d{2}(?:\.\d+)?)/.exec(line)
        if (match) return parseClock(match[1])
    }
    return null
}

export function SubtitleGeneratorTool() {
    const { ensureLoaded, isLoading: isLoadingEngine, progress, setProgress } = useFFmpeg()
    const { tier } = usePlan()
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const jobRef = useRef<Job | null>(null)

    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [meta, setMeta] = useState<VideoMeta | null>(null)
    const [style, setStyle] = useState<SubtitleStyle>("standard")
    const [language, setLanguage] = useState("original")
    const [status, setStatus] = useState<Status>({ kind: "idle" })
    const [cues, setCues] = useState<SubtitleCue[] | null>(null)
    const [missingParts, setMissingParts] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [resultLanguage, setResultLanguage] = useState("original")

    const maxMinutes = tier === "pro" ? SUBTITLE_MINUTE_LIMITS.pro : SUBTITLE_MINUTE_LIMITS.free
    const isBusy = status.kind === "extracting" || status.kind === "transcribing" || isLoadingEngine
    const isRtl = Boolean(cues && findTranslateLanguage(resultLanguage)?.rtl)

    const vttUrl = useMemo(() => {
        if (!cues || cues.length === 0) return null
        return URL.createObjectURL(new Blob([toVtt(cues)], { type: "text/vtt" }))
    }, [cues])

    useEffect(() => {
        return () => {
            if (vttUrl) URL.revokeObjectURL(vttUrl)
        }
    }, [vttUrl])

    // Show the subtitles on the preview player so they can be checked while editing.
    useEffect(() => {
        const video = videoRef.current
        if (!video) return
        video.querySelectorAll("track").forEach((track) => track.remove())
        if (!vttUrl) return
        const track = document.createElement("track")
        track.kind = "subtitles"
        track.label = "Subtitles"
        track.src = vttUrl
        track.default = true
        video.appendChild(track)
        track.track.mode = "showing"
    }, [vttUrl, previewUrl])

    useEffect(() => {
        const video = videoRef.current
        if (!video) return
        const onTime = () => setCurrentTime(video.currentTime)
        video.addEventListener("timeupdate", onTime)
        return () => video.removeEventListener("timeupdate", onTime)
    }, [previewUrl])

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    function reset() {
        jobRef.current = null
        setCues(null)
        setMissingParts(0)
        setStatus({ kind: "idle" })
    }

    function handleClear() {
        reset()
        setFile(null)
        setPreviewUrl(null)
        setMeta(null)
    }

    async function handleFileSelect(next: File) {
        reset()
        try {
            const info = await getVideoMeta(next)
            setFile(next)
            setPreviewUrl(info.url)
            setMeta({ duration: info.duration, width: info.width, height: info.height })
        } catch {
            // Some audio/video files can't be previewed by the browser but ffmpeg can still read them.
            setFile(next)
            setPreviewUrl(null)
            setMeta(null)
        }
    }

    /** Extracts a small mono MP3 with ffmpeg.wasm, finds pauses, and slices it into ~5 minute parts. */
    async function extractParts(source: File): Promise<{ parts: AudioPart[]; totalSeconds: number }> {
        const ffmpeg = await ensureLoaded()
        setStatus({ kind: "extracting" })
        setProgress(0)

        const ext = source.name.split(".").pop()?.toLowerCase() || "mp4"
        const inputName = `subs-input.${ext}`
        const audioName = "subs-audio.mp3"
        const logs: string[] = []
        const onLog = ({ message }: { message: string }) => logs.push(message)

        await ffmpeg.writeFile(inputName, await fetchFile(source))
        ffmpeg.on("log", onLog)
        let exitCode: number
        try {
            // 16 kHz mono at 32 kbps is plenty for speech and keeps an hour of audio around 14 MB.
            exitCode = await ffmpeg.exec([
                "-i", inputName,
                "-vn", "-ac", "1", "-ar", "16000",
                "-af", "silencedetect=noise=-35dB:d=0.35",
                "-c:a", "libmp3lame", "-b:a", "32k",
                audioName,
            ])
        } finally {
            ffmpeg.off("log", onLog)
            await ffmpeg.deleteFile(inputName).catch(() => {})
        }

        if (exitCode !== 0) {
            await ffmpeg.deleteFile(audioName).catch(() => {})
            const noAudio = logs.some((line) => /does not contain any stream|matches no streams|no audio/i.test(line))
            throw new Error(noAudio ? "This file has no audio track to subtitle." : "Could not read the audio in this file.")
        }

        const duration =
            meta && Number.isFinite(meta.duration) && meta.duration > 0 ? meta.duration : durationFromLog(logs)
        if (!duration) {
            await ffmpeg.deleteFile(audioName).catch(() => {})
            throw new Error("Could not work out how long this file is.")
        }

        const cuts = chooseCutPoints(duration, parseSilenceLog(logs))
        const parts: AudioPart[] = []
        try {
            for (let i = 0; i < cuts.length - 1; i++) {
                const start = cuts[i]
                const length = cuts[i + 1] - start
                const partName = `subs-part-${i}.mp3`
                await ffmpeg.exec(["-ss", start.toFixed(3), "-t", length.toFixed(3), "-i", audioName, "-c", "copy", partName])
                const data = await ffmpeg.readFile(partName)
                await ffmpeg.deleteFile(partName).catch(() => {})
                parts.push({ start, duration: length, base64: await fileToBase64(bytesToBlob(data as Uint8Array, "audio/mpeg")) })
            }
        } finally {
            await ffmpeg.deleteFile(audioName).catch(() => {})
        }
        return { parts, totalSeconds: duration }
    }

    /** Sends every part that hasn't succeeded yet. Part 0 goes first: it pays the credit and returns the job token. */
    async function transcribePending(job: Job) {
        const pending = job.results.flatMap((r, i) => (r === null ? [i] : []))
        let done = job.results.length - pending.length
        setStatus({ kind: "transcribing", done, total: job.parts.length })

        const runPart = async (index: number) => {
            const { cues: partCues, token } = await requestPartWithRetry(job, index)
            if (token) job.token = token
            job.results[index] = partCues
            done++
            setStatus({ kind: "transcribing", done, total: job.parts.length })
            setCues(mergeResults(job.results))
        }

        if (pending[0] === 0) {
            try {
                await runPart(0)
            } catch (error) {
                jobRef.current = null
                if (error instanceof PartError && error.status === 401) return setStatus({ kind: "auth-required" })
                if (error instanceof PartError && error.status === 429) {
                    return setStatus({ kind: "quota-exceeded", message: error.message })
                }
                return setStatus({
                    kind: "error",
                    message: error instanceof Error ? error.message : "AI couldn't create subtitles. Please try again.",
                })
            }
            pending.shift()
        }

        let failure: string | null = null
        const queue = [...pending]
        const worker = async () => {
            for (let index = queue.shift(); index !== undefined; index = queue.shift()) {
                try {
                    await runPart(index)
                } catch (error) {
                    failure = error instanceof Error ? error.message : "Some parts failed."
                    // An expired job can't be resumed; stop sending the rest.
                    if (error instanceof PartError && error.status === 403) queue.length = 0
                }
            }
        }
        await Promise.all(Array.from({ length: Math.min(PART_CONCURRENCY, queue.length) }, worker))

        const missing = job.results.filter((r) => r === null).length
        setMissingParts(missing)
        setCues(mergeResults(job.results))
        setStatus(missing > 0 && failure ? { kind: "error", message: failure } : { kind: "idle" })
    }

    async function handleGenerate() {
        if (!file || isBusy) return
        if (meta && Number.isFinite(meta.duration) && meta.duration > maxMinutes * 60 + 5) {
            setStatus({
                kind: "error",
                message:
                    tier === "pro"
                        ? `Videos up to ${maxMinutes} minutes are supported.`
                        : `Free accounts can subtitle videos up to ${maxMinutes} minutes. Upgrade to Pro for up to ${SUBTITLE_MINUTE_LIMITS.pro} minutes.`,
            })
            return
        }

        reset()
        try {
            const { parts, totalSeconds } = await extractParts(file)
            const job: Job = { parts, totalSeconds, token: null, style, language, results: parts.map(() => null) }
            jobRef.current = job
            setResultLanguage(language)
            await transcribePending(job)
        } catch (error) {
            setStatus({ kind: "error", message: error instanceof Error ? error.message : "Could not process this file." })
        }
    }

    async function handleRetryMissing() {
        const job = jobRef.current
        if (!job || isBusy) return
        await transcribePending(job)
    }

    function updateCueText(index: number, text: string) {
        setCues((prev) => prev && prev.map((cue, i) => (i === index ? { ...cue, text } : cue)))
    }

    function deleteCue(index: number) {
        setCues((prev) => prev && prev.filter((_, i) => i !== index))
    }

    function shiftAll(offset: number) {
        setCues((prev) => prev && shiftCues(prev, offset))
    }

    function seekTo(seconds: number) {
        const video = videoRef.current
        if (!video) return
        video.currentTime = seconds + 0.01
        void video.play().catch(() => {})
    }

    function download(format: "srt" | "vtt" | "txt") {
        if (!cues || !file) return
        const content = format === "srt" ? toSrt(cues) : format === "vtt" ? toVtt(cues) : toPlainText(cues)
        const type = format === "vtt" ? "text/vtt" : format === "srt" ? "application/x-subrip" : "text/plain"
        downloadBlob(new Blob([content], { type: `${type};charset=utf-8` }), replaceExtension(file.name, format))
    }

    const activeIndex = cues ? cues.findIndex((cue) => currentTime >= cue.start && currentTime < cue.end) : -1
    const transcribeProgress = status.kind === "transcribing" ? status.done / Math.max(1, status.total) : 0

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">AI Subtitle Generator</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Upload a video or audio file and get timed subtitles as SRT or VTT, in the spoken language or translated
                into 35+ others. Your file is processed in the browser; only the audio is sent to the AI.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <VideoDropzone
                        ref={videoRef}
                        file={file}
                        previewUrl={previewUrl}
                        meta={meta}
                        onFileSelect={handleFileSelect}
                        onClear={file && !isBusy ? handleClear : undefined}
                        accept="video/*,audio/*"
                        hint={`MP4, MOV, WEBM, MKV, MP3, WAV, M4A — up to ${maxMinutes} minutes`}
                    />

                    {file && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Caption style</p>
                                <ToolSegmentedControl
                                    value={style}
                                    onChange={setStyle}
                                    options={[
                                        { value: "standard", label: "YouTube (2 lines)" },
                                        { value: "short", label: "Reels / Shorts (short)" },
                                    ]}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Subtitle language</p>
                                <Select value={language} onValueChange={setLanguage} disabled={isBusy}>
                                    <SelectTrigger className="w-full rounded-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="original">Same as spoken (no translation)</SelectItem>
                                        {TRANSLATE_LANGUAGES.map((lang) => (
                                            <SelectItem key={lang.code} value={lang.code}>
                                                Translate to {lang.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button type="button" className="w-full rounded-full" onClick={handleGenerate} disabled={isBusy}>
                                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Captions className="h-4 w-4" />}
                                {cues ? "Generate again" : "Generate subtitles"}
                            </Button>

                            {isBusy && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {isLoadingEngine
                                            ? "Loading the audio engine (first time only, ~30 MB)..."
                                            : status.kind === "extracting"
                                              ? "Extracting audio..."
                                              : status.kind === "transcribing"
                                                ? `Writing subtitles... part ${Math.min(status.done + 1, status.total)} of ${status.total}`
                                                : "Working..."}
                                    </p>
                                    <Progress
                                        value={Math.round((status.kind === "extracting" ? progress : transcribeProgress) * 100)}
                                        className="h-1.5"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {status.kind === "auth-required" && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            <Link href={`/login?callbackUrl=${TOOL_PATH}`} className="underline">
                                Sign in
                            </Link>{" "}
                            to generate subtitles with AI.
                        </p>
                    )}

                    {status.kind === "quota-exceeded" && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            {status.message}{" "}
                            <Link href="/dashboard/premium" className="underline">
                                Upgrade for more
                            </Link>
                            .
                        </p>
                    )}

                    {status.kind === "error" && (
                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-sm text-destructive">
                                {status.message}
                                {missingParts > 0 &&
                                    ` ${missingParts} part${missingParts > 1 ? "s are" : " is"} missing from the subtitles.`}
                            </p>
                            {missingParts > 0 ? (
                                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleRetryMissing}>
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Retry missing parts
                                </Button>
                            ) : (
                                file && (
                                    <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleGenerate}>
                                        Try again
                                    </Button>
                                )
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                            Subtitles
                            {cues && cues.length > 0 && (
                                <span className="ms-2 text-xs font-normal text-muted-foreground">{cues.length} lines</span>
                            )}
                        </p>
                        {cues && cues.length > 0 && !isBusy && (
                            <div className="flex items-center gap-1.5">
                                <CopyButton value={toSrt(cues)} label="Copy SRT" variant="ghost" className="sm:w-auto" />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" size="sm" className="rounded-full">
                                            <Download className="h-3.5 w-3.5" />
                                            Download
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => download("srt")}>SRT (.srt) — YouTube, Premiere, CapCut</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => download("vtt")}>WebVTT (.vtt) — web players</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => download("txt")}>Plain text (.txt)</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>

                    {cues && cues.length > 0 && !isBusy && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>Out of sync? Shift all</span>
                            <Button type="button" variant="outline" size="sm" className="h-7 rounded-full px-2.5" onClick={() => shiftAll(-0.5)}>
                                <Minus className="h-3 w-3" />
                                0.5s
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="h-7 rounded-full px-2.5" onClick={() => shiftAll(0.5)}>
                                <Plus className="h-3 w-3" />
                                0.5s
                            </Button>
                        </div>
                    )}

                    <div className="max-h-[32rem] min-h-56 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 p-2">
                        {cues && cues.length > 0 ? (
                            <ol className="space-y-1" dir={isRtl ? "rtl" : "ltr"}>
                                {cues.map((cue, index) => (
                                    <li
                                        key={`${index}-${cue.start}`}
                                        className={`group flex gap-2 rounded-xl p-2 ${index === activeIndex ? "bg-primary/10" : ""}`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => seekTo(cue.start)}
                                            disabled={!previewUrl}
                                            className="shrink-0 pt-1 text-start font-mono text-[11px] leading-4 text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                                            dir="ltr"
                                            title="Play from here"
                                        >
                                            {formatCueTime(cue.start, ".").slice(cue.start >= 3600 ? 0 : 3, -2)}
                                            <br />
                                            <span className="text-muted-foreground">
                                                {formatCueTime(cue.end, ".").slice(cue.end >= 3600 ? 0 : 3, -2)}
                                            </span>
                                        </button>
                                        <textarea
                                            value={cue.text}
                                            onChange={(e) => updateCueText(index, e.target.value)}
                                            rows={Math.max(1, cue.text.split("\n").length)}
                                            disabled={isBusy}
                                            className="min-w-0 flex-1 resize-none rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm leading-5 outline-none focus:border-primary focus:bg-background"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="shrink-0 rounded-full opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                            onClick={() => deleteCue(index)}
                                            disabled={isBusy}
                                            aria-label="Delete line"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <div className="flex min-h-52 flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
                                {isBusy ? (
                                    <>
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        <p className="text-xs">Subtitles will appear here as each part is ready.</p>
                                    </>
                                ) : cues && cues.length === 0 ? (
                                    <p className="text-xs">No speech was found in this file.</p>
                                ) : (
                                    <>
                                        <Captions className="h-8 w-8" />
                                        <p className="text-xs">Upload a file and click Generate. You can edit every line before downloading.</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {cues && cues.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Play the video to check the subtitles, click a time to jump to it, and edit any line before
                            downloading. {meta && Number.isFinite(meta.duration) && `Length: ${formatDuration(meta.duration)}. `}
                            AI subtitles can contain mistakes.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
