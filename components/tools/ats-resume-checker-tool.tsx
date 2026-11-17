"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, CheckCircle2, Crown, Download, FileText, Loader2, Lock, ScanSearch, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/tools/copy-button"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { extractTextFromFile } from "@/lib/ai-file-text-extract"
import { ATS_LIMITS, type AtsReport, type CheckStatus, type FixPriority, type KeywordResult } from "@/lib/ats"
import { usePdfJs } from "@/lib/use-pdfjs"
import { cn } from "@/lib/utils"

type Status =
    | { kind: "idle" }
    | { kind: "reading" }
    | { kind: "checking" }
    | { kind: "error"; message: string }
    | { kind: "auth-required" }
    | { kind: "quota-exceeded"; message: string }

const TOOL_PATH = "/tools/ai-tools/ats-resume-checker"
const UPGRADE_PATH = "/dashboard/premium"

function scoreTone(score: number) {
    if (score >= 80) return { text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", stroke: "stroke-emerald-500" }
    if (score >= 65) return { text: "text-lime-600 dark:text-lime-400", bar: "bg-lime-500", stroke: "stroke-lime-500" }
    if (score >= 50) return { text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", stroke: "stroke-amber-500" }
    return { text: "text-red-600 dark:text-red-400", bar: "bg-red-500", stroke: "stroke-red-500" }
}

const PRIORITY_STYLE: Record<FixPriority, string> = {
    high: "bg-red-500/10 text-red-700 dark:text-red-400",
    medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    low: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
}

function CheckIcon({ status }: { status: CheckStatus }) {
    if (status === "pass") return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
    if (status === "warn") return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
    return <XCircle className="h-4 w-4 shrink-0 text-red-500" />
}

function ScoreRing({ score }: { score: number }) {
    const radius = 52
    const circumference = 2 * Math.PI * radius
    const tone = scoreTone(score)
    return (
        <div className="relative h-36 w-36 shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r={radius} className="fill-none stroke-muted" strokeWidth="10" />
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className={cn("fill-none transition-[stroke-dashoffset] duration-700", tone.stroke)}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - score / 100)}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-4xl font-semibold tabular-nums", tone.text)}>{score}</span>
                <span className="text-xs text-muted-foreground">out of 100</span>
            </div>
        </div>
    )
}

function KeywordChip({ keyword }: { keyword: KeywordResult }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
                keyword.found
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300"
            )}
            title={keyword.aliases.length ? `Also matches: ${keyword.aliases.join(", ")}` : undefined}
        >
            {keyword.found ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {keyword.term}
            {keyword.importance === "required" && <span className="opacity-60">· required</span>}
        </span>
    )
}

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
    return (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{children}</p>
            {aside}
        </div>
    )
}

function toMarkdown(report: AtsReport): string {
    const lines = [`# ATS resume report: ${report.score}/100`, report.verdict, ""]
    if (report.jobTitle) lines.push(`Role: ${report.jobTitle}`, "")
    lines.push("## Score breakdown", ...report.parts.map((p) => `- ${p.label}: ${p.score}/100`), "")
    if (report.keywords.length) {
        lines.push(
            "## Keywords",
            `Found: ${report.keywords.filter((k) => k.found).map((k) => k.term).join(", ") || "none"}`,
            `Missing: ${report.keywords.filter((k) => !k.found).map((k) => k.term).join(", ") || "none"}`,
            ""
        )
    }
    lines.push("## Checks", ...report.checks.map((c) => `- [${c.status === "pass" ? "x" : " "}] ${c.label}: ${c.detail}`), "")
    if (report.fixes.length) {
        lines.push("## Fixes", ...report.fixes.map((f) => `- **${f.priority.toUpperCase()} · ${f.section}:** ${f.issue} ${f.fix}`), "")
    }
    if (report.bulletRewrites.length) {
        lines.push("## Bullet rewrites", ...report.bulletRewrites.flatMap((b) => [`- Before: ${b.original}`, `  After: ${b.improved}`]), "")
    }
    if (report.tailoredSummary) lines.push("## Suggested summary", report.tailoredSummary, "")
    return lines.join("\n")
}

export function AtsResumeCheckerTool() {
    const { pdfjsLib } = usePdfJs()
    const [file, setFile] = useState<File | null>(null)
    const [resumeText, setResumeText] = useState<string | null>(null)
    const [jobText, setJobText] = useState("")
    const [status, setStatus] = useState<Status>({ kind: "idle" })
    const [report, setReport] = useState<AtsReport | null>(null)
    const [previousScore, setPreviousScore] = useState<number | null>(null)
    /** The last report's job and keywords, so re-checking the same job is scored the same way. */
    const [baseline, setBaseline] = useState<{ jobText: string; keywords: AtsReport["jobKeywords"]; score: number } | null>(null)

    const isBusy = status.kind === "reading" || status.kind === "checking"
    const jobLength = jobText.trim().length
    const jobTooShort = jobLength > 0 && jobLength < ATS_LIMITS.jobMinChars
    const jobTooLong = jobLength > ATS_LIMITS.jobMaxChars

    async function handleFileSelect(next: File) {
        setFile(next)
        setResumeText(null)
        setReport(null)
        setStatus({ kind: "reading" })
        try {
            const text = (await extractTextFromFile(next, pdfjsLib, { preserveLines: true })).trim()
            if (text.length < ATS_LIMITS.resumeMinChars) {
                setStatus({
                    kind: "error",
                    message:
                        "We could only read a few words from this file. If your resume is a scanned or image PDF, an ATS can't read it either. Export it as a text-based PDF or DOCX.",
                })
                return
            }
            setResumeText(text)
            setStatus({ kind: "idle" })
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not read this file."
            setStatus({
                kind: "error",
                message: /scanned|image-only|no readable text/i.test(message)
                    ? "No text could be read from this resume, so an ATS won't be able to read it either. Export it as a text-based PDF or DOCX (not a scan or image)."
                    : message,
            })
        }
    }

    function handleClear() {
        setFile(null)
        setResumeText(null)
        setReport(null)
        setStatus({ kind: "idle" })
    }

    async function handleCheck() {
        if (!resumeText || isBusy || jobTooShort || jobTooLong) return
        const job = jobText.trim()
        const sameJob = Boolean(job) && baseline?.jobText === job && baseline.keywords.length > 0
        setStatus({ kind: "checking" })
        setReport(null)
        try {
            const res = await fetch("/api/ai/ats-check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ resumeText, jobText: job || null, jobKeywords: sameJob ? baseline?.keywords : undefined }),
            })
            const data = await res.json().catch(() => null)
            if (res.status === 401) return setStatus({ kind: "auth-required" })
            if (res.status === 429) return setStatus({ kind: "quota-exceeded", message: data?.error || "Daily AI limit reached." })
            if (!res.ok || !data?.ok || !data?.report) {
                return setStatus({ kind: "error", message: data?.error || "AI couldn't check this resume. Please try again." })
            }
            const next = data.report as AtsReport
            setPreviousScore(sameJob && baseline ? baseline.score : null)
            setReport(next)
            setBaseline({ jobText: job, keywords: next.jobKeywords, score: next.score })
            setStatus({ kind: "idle" })
        } catch {
            setStatus({ kind: "error", message: "AI couldn't check this resume. Please try again." })
        }
    }

    function downloadReport() {
        if (!report) return
        const href = URL.createObjectURL(new Blob([toMarkdown(report)], { type: "text/markdown;charset=utf-8" }))
        const a = document.createElement("a")
        a.href = href
        a.download = "ats-resume-report.md"
        a.click()
        setTimeout(() => URL.revokeObjectURL(href), 1000)
    }

    const found = report?.keywords.filter((k) => k.found) ?? []
    const missing = report?.keywords.filter((k) => !k.found) ?? []
    const missingRequired = missing.filter((k) => k.importance === "required").length

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">ATS Resume Checker</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                See how applicant tracking systems read your resume. Upload it with the job description to get a match
                score, the keywords you&apos;re missing, and exactly what to fix before you apply.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">1. Your resume</p>
                    <GenericFileDropzone
                        file={file}
                        onFileSelect={handleFileSelect}
                        onClear={isBusy ? undefined : handleClear}
                        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                        hint="PDF, DOCX, or TXT"
                        icon={FileText}
                        className="min-h-48"
                    />
                    {status.kind === "reading" && (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Reading resume...
                        </p>
                    )}
                    {resumeText && (
                        <p className="text-xs text-muted-foreground">
                            <CheckCircle2 className="me-1 inline h-3.5 w-3.5 text-emerald-500" />
                            Read {resumeText.split(/\s+/).length.toLocaleString()} words, the same text an ATS sees.
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                        <p className="text-xs font-medium text-muted-foreground">2. Job description (recommended)</p>
                        <span className={cn("text-[11px] tabular-nums", jobTooLong ? "text-destructive" : "text-muted-foreground")}>
                            {jobLength.toLocaleString()} / {ATS_LIMITS.jobMaxChars.toLocaleString()}
                        </span>
                    </div>
                    <Textarea
                        value={jobText}
                        onChange={(e) => setJobText(e.target.value)}
                        placeholder="Paste the full job description from Naukri, LinkedIn, Indeed, or the company's careers page..."
                        className="min-h-48 resize-y rounded-2xl text-sm"
                        disabled={status.kind === "checking"}
                    />
                    {jobTooShort && <p className="text-xs text-destructive">Paste the full job description for an accurate match.</p>}
                    {jobLength === 0 && (
                        <p className="text-xs text-muted-foreground">Leave empty for a general ATS check without a match score.</p>
                    )}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                    type="button"
                    className="rounded-full"
                    onClick={handleCheck}
                    disabled={!resumeText || isBusy || jobTooShort || jobTooLong}
                >
                    {status.kind === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                    {report ? "Check again" : jobLength > 0 ? "Check match" : "Check resume"}
                </Button>
                {status.kind === "checking" && (
                    <p className="text-sm text-muted-foreground">Scanning like an ATS and a recruiter would... about 20 seconds.</p>
                )}
            </div>

            {status.kind === "auth-required" && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                    <Link href={`/login?callbackUrl=${TOOL_PATH}`} className="underline">
                        Sign in
                    </Link>{" "}
                    to check your resume with AI.
                </p>
            )}
            {status.kind === "quota-exceeded" && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                    {status.message}{" "}
                    <Link href={UPGRADE_PATH} className="underline">
                        Upgrade for more
                    </Link>
                    .
                </p>
            )}
            {status.kind === "error" && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <p className="text-sm text-destructive">{status.message}</p>
                    {resumeText && (
                        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleCheck}>
                            Try again
                        </Button>
                    )}
                </div>
            )}

            {report && status.kind !== "checking" && (
                <div className="mt-6 space-y-4">
                    {/* Score */}
                    <div className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:flex-row sm:items-center sm:p-5">
                        <ScoreRing score={report.score} />
                        <div className="min-w-0 flex-1 space-y-3">
                            <div>
                                <p className="text-base font-semibold">{report.verdict}</p>
                                {previousScore !== null && previousScore !== report.score && (
                                    <p
                                        className={cn(
                                            "text-sm font-medium tabular-nums",
                                            report.score > previousScore ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                        )}
                                    >
                                        {report.score > previousScore ? "▲" : "▼"} {Math.abs(report.score - previousScore)} points since your last check ({previousScore})
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {report.hasJobDescription
                                        ? `ATS match score${report.jobTitle ? ` for ${report.jobTitle}` : ""}`
                                        : "General ATS score. Add a job description to see your match."}
                                </p>
                            </div>
                            <div className="space-y-2">
                                {report.parts.map((part) => (
                                    <div key={part.id} className="grid grid-cols-[minmax(0,10rem)_1fr_2.5rem] items-center gap-2 text-xs">
                                        <span className="truncate text-muted-foreground">{part.label}</span>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                            <div className={cn("h-full rounded-full", scoreTone(part.score).bar)} style={{ width: `${part.score}%` }} />
                                        </div>
                                        <span className="text-end tabular-nums">{part.score}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <CopyButton value={toMarkdown(report)} label="Copy report" variant="outline" className="sm:w-auto" />
                                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={downloadReport}>
                                    <Download className="h-4 w-4" />
                                    Download .md
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Keywords */}
                        {report.hasJobDescription && (
                            <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                                <SectionTitle aside={<span className="text-xs tabular-nums text-muted-foreground">{found.length} of {report.keywords.length} found</span>}>
                                    Job keywords
                                </SectionTitle>
                                {missing.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">
                                            Missing{missingRequired > 0 && `, including ${missingRequired} required`}. Add the ones you genuinely have, in the
                                            exact wording:
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {missing.map((k) => (
                                                <KeywordChip key={k.term} keyword={k} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {found.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">Already on your resume:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {found.map((k) => (
                                                <KeywordChip key={k.term} keyword={k} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Checks */}
                        <div className={cn("space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4", !report.hasJobDescription && "lg:col-span-2")}>
                            <SectionTitle>ATS checks</SectionTitle>
                            <ul className="space-y-2.5">
                                {report.checks.map((check) => (
                                    <li key={check.id} className="flex gap-2.5 text-sm">
                                        <CheckIcon status={check.status} />
                                        <div className="min-w-0">
                                            <p className="leading-4 font-medium">{check.label}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">{check.detail}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            {(report.experienceNote || report.impactNote) && (
                                <div className="space-y-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                                    {report.experienceNote && (
                                        <p>
                                            <span className="font-medium text-foreground">Experience: </span>
                                            {report.experienceNote}
                                        </p>
                                    )}
                                    {report.impactNote && (
                                        <p>
                                            <span className="font-medium text-foreground">Impact: </span>
                                            {report.impactNote}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fixes */}
                    {(report.fixes.length > 0 || (report.locked?.fixes ?? 0) > 0) && (
                        <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <SectionTitle>What to fix</SectionTitle>
                            <ol className="space-y-3">
                                {report.fixes.map((fix, index) => (
                                    <li key={index} className="flex gap-3 text-sm">
                                        <span className="mt-0.5 w-5 shrink-0 text-end text-xs tabular-nums text-muted-foreground">{index + 1}.</span>
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", PRIORITY_STYLE[fix.priority])}>
                                                    {fix.priority}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{fix.section}</span>
                                            </div>
                                            <p className="font-medium">{fix.issue}</p>
                                            <p className="text-muted-foreground">{fix.fix}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Pro: rewrites and summary */}
                    {report.bulletRewrites.length > 0 && (
                        <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <SectionTitle>Stronger bullet points</SectionTitle>
                            <ul className="space-y-3">
                                {report.bulletRewrites.map((bullet, index) => (
                                    <li key={index} className="space-y-1.5 rounded-xl border border-border/60 bg-background p-3 text-sm">
                                        <p className="text-muted-foreground line-through decoration-muted-foreground/40">{bullet.original}</p>
                                        <div className="flex items-start gap-2">
                                            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <p className="flex-1">{bullet.improved}</p>
                                            <CopyButton value={bullet.improved} label="" variant="ghost" className="h-7 w-7 shrink-0 px-0 sm:w-7" />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-muted-foreground">Replace [placeholders] with your real numbers, or remove them.</p>
                        </div>
                    )}

                    {report.tailoredSummary && (
                        <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <SectionTitle aside={<CopyButton value={report.tailoredSummary} label="Copy" variant="ghost" className="sm:w-auto" />}>
                                Suggested summary
                            </SectionTitle>
                            <p className="text-sm leading-6">{report.tailoredSummary}</p>
                        </div>
                    )}

                    {report.locked && (report.locked.fixes > 0 || report.locked.bulletRewrites > 0 || report.locked.tailoredSummary) && (
                        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                    <p className="font-semibold">Unlock your full fix list with Pro</p>
                                    <ul className="space-y-0.5 text-sm text-muted-foreground">
                                        {report.locked.fixes > 0 && <li>+ {report.locked.fixes} more fixes for this job</li>}
                                        {report.locked.bulletRewrites > 0 && (
                                            <li>+ {report.locked.bulletRewrites} of your bullet points rewritten with action verbs and results</li>
                                        )}
                                        {report.locked.tailoredSummary && <li>+ A profile summary written for this job</li>}
                                    </ul>
                                </div>
                                <Button asChild className="rounded-full">
                                    <Link href={UPGRADE_PATH}>
                                        <Crown className="h-4 w-4" />
                                        Upgrade to Pro
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                        Scores estimate how ATS software and recruiters will rank your resume; every company&apos;s system is
                        different. Only add skills and results you really have.
                    </p>
                </div>
            )}
        </div>
    )
}
