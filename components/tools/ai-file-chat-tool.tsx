"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, Loader2, Send, Sparkles, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { usePdfJs } from "@/lib/use-pdfjs"
import { extractTextFromFile } from "@/lib/ai-file-text-extract"
import { cn } from "@/lib/utils"

type Status =
    | { kind: "idle" }
    | { kind: "extracting" }
    | { kind: "error"; message: string }
    | { kind: "auth-required" }
    | { kind: "quota-exceeded"; message: string }

type ChatEntry = { role: "user" | "assistant"; content: string }

export function AiFileChatTool() {
    const { pdfjsLib } = usePdfJs()
    const [file, setFile] = useState<File | null>(null)
    const [documentText, setDocumentText] = useState<string | null>(null)
    const [status, setStatus] = useState<Status>({ kind: "idle" })
    const [messages, setMessages] = useState<ChatEntry[]>([])
    const [question, setQuestion] = useState("")
    const [isAsking, setIsAsking] = useState(false)

    async function handleFileSelect(nextFile: File) {
        setFile(nextFile)
        setDocumentText(null)
        setMessages([])
        setStatus({ kind: "extracting" })

        try {
            const text = await extractTextFromFile(nextFile, pdfjsLib)
            setDocumentText(text)
            setStatus({ kind: "idle" })
        } catch (err) {
            setStatus({ kind: "error", message: err instanceof Error ? err.message : "Could not read this file." })
        }
    }

    function handleClear() {
        setFile(null)
        setDocumentText(null)
        setMessages([])
        setStatus({ kind: "idle" })
    }

    async function handleAsk() {
        const trimmed = question.trim()
        if (!trimmed || !documentText || isAsking) return

        const nextMessages: ChatEntry[] = [...messages, { role: "user", content: trimmed }]
        setMessages(nextMessages)
        setQuestion("")
        setIsAsking(true)

        try {
            const res = await fetch("/api/ai/file-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({
                    documentText,
                    question: trimmed,
                    history: messages,
                }),
            })

            const data = await res.json().catch(() => null)

            if (res.status === 401) {
                setStatus({ kind: "auth-required" })
                setMessages(messages)
                return
            }

            if (res.status === 429) {
                setStatus({ kind: "quota-exceeded", message: data?.error || "Daily AI limit reached." })
                setMessages(messages)
                return
            }

            if (!res.ok || !data?.ok || !data?.answer) {
                setMessages([...nextMessages, { role: "assistant", content: data?.error || "AI failed to answer. Please try again." }])
                return
            }

            setStatus({ kind: "idle" })
            setMessages([...nextMessages, { role: "assistant", content: data.answer as string }])
        } catch {
            setMessages([...nextMessages, { role: "assistant", content: "AI failed to answer. Please try again." }])
        } finally {
            setIsAsking(false)
        }
    }

    const isExtracting = status.kind === "extracting"

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">AI File Chat</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Upload a PDF, DOCX, or TXT file and ask questions about its content.
            </p>

            <div className="mt-6">
                <GenericFileDropzone
                    file={file}
                    onFileSelect={handleFileSelect}
                    onClear={handleClear}
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    hint="Click to upload or drag & drop a PDF, DOCX, or TXT file"
                    icon={FileText}
                />
            </div>

            {isExtracting && (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reading document...
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

            {status.kind === "auth-required" && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                    <Link href="/login?callbackUrl=/tools/ai-tools/ai-file-chat" className="underline">
                        Sign in
                    </Link>{" "}
                    to chat with your files using AI.
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

            {documentText && !isExtracting && (
                <div className="mt-6">
                    <div className="max-h-[420px] min-h-[160px] space-y-3 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 p-4">
                        {messages.length === 0 ? (
                            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Sparkles className="h-3.5 w-3.5" />
                                Ask anything about this document to get started.
                            </p>
                        ) : (
                            messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={cn("flex items-start gap-2.5", message.role === "user" && "flex-row-reverse")}
                                >
                                    <span
                                        className={cn(
                                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                                            message.role === "user" ? "bg-foreground text-background" : "bg-muted"
                                        )}
                                    >
                                        {message.role === "user" ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                                    </span>
                                    <p
                                        className={cn(
                                            "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-6",
                                            message.role === "user"
                                                ? "bg-foreground text-background"
                                                : "border border-border/60 bg-card text-foreground"
                                        )}
                                    >
                                        {message.content}
                                    </p>
                                </div>
                            ))
                        )}
                        {isAsking && (
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                                    <Sparkles className="h-3.5 w-3.5" />
                                </span>
                                <span className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3.5 py-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Thinking...
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="mt-3 flex items-end gap-2">
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleAsk()
                                }
                            }}
                            placeholder="Ask a question about this document..."
                            rows={1}
                            maxLength={2000}
                            className="min-h-9 flex-1 resize-none rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                        <Button
                            type="button"
                            size="icon"
                            className="rounded-full"
                            onClick={handleAsk}
                            disabled={!question.trim() || isAsking}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
