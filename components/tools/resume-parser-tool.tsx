"use client"

import { useState } from "react"
import Link from "next/link"
import { Briefcase, FileText, GraduationCap, Loader2, Mail, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { CopyButton } from "@/components/tools/copy-button"
import { usePdfJs } from "@/lib/use-pdfjs"
import { extractTextFromFile } from "@/lib/ai-file-text-extract"
import type { ParsedResume } from "@/lib/ai/gemini"

type Status =
    | { kind: "idle" }
    | { kind: "extracting" }
    | { kind: "generating" }
    | { kind: "error"; message: string }
    | { kind: "auth-required" }
    | { kind: "quota-exceeded"; message: string }

export function ResumeParserTool() {
    const { pdfjsLib } = usePdfJs()
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<Status>({ kind: "idle" })
    const [result, setResult] = useState<ParsedResume | null>(null)

    async function handleFileSelect(nextFile: File) {
        setFile(nextFile)
        setResult(null)
        setStatus({ kind: "extracting" })

        try {
            const text = await extractTextFromFile(nextFile, pdfjsLib)
            await parseResume(text)
        } catch (err) {
            setStatus({ kind: "error", message: err instanceof Error ? err.message : "Could not read this file." })
        }
    }

    async function parseResume(text: string) {
        setStatus({ kind: "generating" })

        try {
            const res = await fetch("/api/ai/resume-parser", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ text }),
            })

            const data = await res.json().catch(() => null)

            if (res.status === 401) {
                setStatus({ kind: "auth-required" })
                return
            }

            if (res.status === 429) {
                setStatus({ kind: "quota-exceeded", message: data?.error || "Daily AI limit reached." })
                return
            }

            if (!res.ok || !data?.ok || !data?.result) {
                setStatus({ kind: "error", message: data?.error || "AI resume parsing failed. Please try again." })
                return
            }

            setResult(data.result as ParsedResume)
            setStatus({ kind: "idle" })
        } catch {
            setStatus({ kind: "error", message: "AI resume parsing failed. Please try again." })
        }
    }

    function handleClear() {
        setFile(null)
        setResult(null)
        setStatus({ kind: "idle" })
    }

    const isBusy = status.kind === "extracting" || status.kind === "generating"

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Resume Parser</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Upload a resume (PDF, DOCX, or TXT) and extract structured contact info, skills,
                experience, and education with AI.
            </p>

            <div className="mt-6">
                <GenericFileDropzone
                    file={file}
                    onFileSelect={handleFileSelect}
                    onClear={handleClear}
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    hint="Click to upload or drag & drop a resume"
                    icon={FileText}
                />
            </div>

            {status.kind === "extracting" && (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reading resume...
                </p>
            )}

            {status.kind === "generating" && (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting details with AI...
                </p>
            )}

            {status.kind === "auth-required" && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                    <Link href="/login?callbackUrl=/tools/ai-tools/resume-parser" className="underline">
                        Sign in
                    </Link>{" "}
                    to parse resumes with AI.
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
                    {file && (
                        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => handleFileSelect(file)}>
                            Try again
                        </Button>
                    )}
                </div>
            )}

            {result && !isBusy && (
                <div className="mt-6 space-y-5 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-base font-semibold text-foreground">{result.name || "Name not found"}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {result.email && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5" />
                                        {result.email}
                                    </span>
                                )}
                                {result.phone && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5" />
                                        {result.phone}
                                    </span>
                                )}
                            </div>
                        </div>
                        <CopyButton
                            value={JSON.stringify(result, null, 2)}
                            label="Copy JSON"
                            variant="ghost"
                            className="sm:w-auto"
                        />
                    </div>

                    {result.summary && <p className="text-sm leading-6 text-foreground">{result.summary}</p>}

                    {result.skills.length > 0 && (
                        <div>
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Skills</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {result.skills.map((skill, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-xs font-medium"
                                    >
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {result.experience.length > 0 && (
                        <div>
                            <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                <Briefcase className="h-3.5 w-3.5" />
                                Experience
                            </p>
                            <div className="mt-2 space-y-3">
                                {result.experience.map((entry, index) => (
                                    <div key={index} className="rounded-xl border border-border/60 bg-background p-3">
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                            <p className="text-sm font-medium text-foreground">{entry.title}</p>
                                            {entry.duration && (
                                                <span className="text-xs text-muted-foreground">{entry.duration}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{entry.company}</p>
                                        {entry.description && (
                                            <p className="mt-1.5 text-sm leading-6 text-foreground">{entry.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {result.education.length > 0 && (
                        <div>
                            <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                <GraduationCap className="h-3.5 w-3.5" />
                                Education
                            </p>
                            <div className="mt-2 space-y-2">
                                {result.education.map((entry, index) => (
                                    <div key={index} className="rounded-xl border border-border/60 bg-background p-3">
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                            <p className="text-sm font-medium text-foreground">{entry.degree}</p>
                                            {entry.year && <span className="text-xs text-muted-foreground">{entry.year}</span>}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{entry.institution}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
