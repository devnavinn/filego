"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { McqQuiz } from "@/lib/pdf-form-types"

type AiGenerateStatus =
    | { kind: "idle" }
    | { kind: "error"; message: string }
    | { kind: "auth-required" }
    | { kind: "quota-exceeded"; message: string }

type OptionDraft = { id: string; text: string }
type QuestionDraft = { id: string; text: string; options: OptionDraft[] }

function makeOption(): OptionDraft {
    return { id: crypto.randomUUID(), text: "" }
}

function makeQuestion(): QuestionDraft {
    return { id: crypto.randomUUID(), text: "", options: [makeOption(), makeOption(), makeOption(), makeOption()] }
}

type McqQuizBuilderProps = {
    onCreate: (quiz: McqQuiz) => void
    onCancel: () => void
    isCreating: boolean
}

export function McqQuizBuilder({ onCreate, onCancel, isCreating }: McqQuizBuilderProps) {
    const [title, setTitle] = useState("Quiz")
    const [questions, setQuestions] = useState<QuestionDraft[]>([makeQuestion()])

    const [aiTopic, setAiTopic] = useState("")
    const [aiQuestionCount, setAiQuestionCount] = useState(10)
    const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium")
    const [isGeneratingAi, setIsGeneratingAi] = useState(false)
    const [aiStatus, setAiStatus] = useState<AiGenerateStatus>({ kind: "idle" })

    async function handleGenerateWithAi() {
        const topic = aiTopic.trim()
        if (!topic) return

        setIsGeneratingAi(true)
        setAiStatus({ kind: "idle" })

        try {
            const res = await fetch("/api/ai/mcq", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ topic, questionCount: aiQuestionCount, difficulty: aiDifficulty }),
            })

            const data = await res.json().catch(() => null)

            if (res.status === 401) {
                setAiStatus({ kind: "auth-required" })
                return
            }

            if (res.status === 429) {
                setAiStatus({ kind: "quota-exceeded", message: data?.error || "Daily AI limit reached." })
                return
            }

            if (!res.ok || !data?.ok || !data?.quiz) {
                setAiStatus({ kind: "error", message: data?.error || "AI generation failed. Please try again." })
                return
            }

            const quiz = data.quiz as McqQuiz
            setTitle(quiz.title || "Quiz")
            setQuestions(
                quiz.questions.map((q) => ({
                    id: q.id,
                    text: q.text,
                    options: q.options.map((o) => ({ id: o.id, text: o.text })),
                }))
            )
        } catch {
            setAiStatus({ kind: "error", message: "AI generation failed. Please try again." })
        } finally {
            setIsGeneratingAi(false)
        }
    }

    const isValid = useMemo(
        () =>
            questions.length > 0 &&
            questions.every(
                (q) => q.text.trim().length > 0 && q.options.filter((o) => o.text.trim().length > 0).length >= 2
            ),
        [questions]
    )

    function updateQuestionText(id: string, text: string) {
        setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, text } : q)))
    }

    function updateOptionText(qId: string, oId: string, text: string) {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === qId ? { ...q, options: q.options.map((o) => (o.id === oId ? { ...o, text } : o)) } : q
            )
        )
    }

    function addQuestion() {
        setQuestions((prev) => [...prev, makeQuestion()])
    }

    function removeQuestion(id: string) {
        setQuestions((prev) => (prev.length > 1 ? prev.filter((q) => q.id !== id) : prev))
    }

    function addOption(qId: string) {
        setQuestions((prev) =>
            prev.map((q) => (q.id === qId && q.options.length < 8 ? { ...q, options: [...q.options, makeOption()] } : q))
        )
    }

    function removeOption(qId: string, oId: string) {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === qId && q.options.length > 2 ? { ...q, options: q.options.filter((o) => o.id !== oId) } : q
            )
        )
    }

    function handleCreate() {
        if (!isValid) return
        onCreate({
            title: title.trim() || "Quiz",
            questions: questions.map((q) => ({
                id: q.id,
                text: q.text.trim(),
                options: q.options.filter((o) => o.text.trim().length > 0).map((o) => ({ id: o.id, text: o.text.trim() })),
            })),
        })
    }

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">MCQ / Quiz Builder</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add your questions and answer choices, then generate a fillable quiz PDF.
                    </p>
                </div>
                <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={onCancel}>
                    Back to templates
                </Button>
            </div>

            <div className="mt-5 rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                    Describe a topic and Gemini will draft the questions and options for you.
                </p>

                <div className="mt-3 flex flex-wrap items-end gap-2">
                    <div className="min-w-[220px] flex-1">
                        <label className="text-xs font-medium text-muted-foreground">Topic</label>
                        <input
                            type="text"
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            placeholder="e.g. Photosynthesis basics"
                            maxLength={300}
                            className="mt-1 h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground">Questions</label>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={aiQuestionCount}
                            onChange={(e) => setAiQuestionCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
                            className="mt-1 h-9 w-20 rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
                        <select
                            value={aiDifficulty}
                            onChange={(e) => setAiDifficulty(e.target.value as "easy" | "medium" | "hard")}
                            className="mt-1 h-9 rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary"
                        >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                    <Button
                        type="button"
                        className="rounded-full"
                        onClick={handleGenerateWithAi}
                        disabled={!aiTopic.trim() || isGeneratingAi}
                    >
                        {isGeneratingAi ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        {isGeneratingAi ? "Generating..." : "Generate"}
                    </Button>
                </div>

                {aiStatus.kind === "auth-required" && (
                    <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                        <Link href="/login?callbackUrl=/pdf-forms" className="underline">
                            Sign in
                        </Link>{" "}
                        to generate quizzes with AI.
                    </p>
                )}
                {aiStatus.kind === "quota-exceeded" && (
                    <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                        {aiStatus.message}{" "}
                        <Link href="/dashboard/premium" className="underline">
                            Upgrade for more
                        </Link>
                        .
                    </p>
                )}
                {aiStatus.kind === "error" && (
                    <p className="mt-3 text-xs text-destructive">{aiStatus.message}</p>
                )}
            </div>

            <div className="mt-5">
                <label className="text-xs font-medium text-muted-foreground">Quiz title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Quiz"
                    className="mt-1 h-9 w-full max-w-sm rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary"
                />
            </div>

            <div className="mt-5 space-y-4">
                {questions.map((question, qIndex) => (
                    <div key={question.id} className="rounded-2xl border border-border/60 bg-background p-4">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Question {qIndex + 1}</span>
                            {questions.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="rounded-full"
                                    onClick={() => removeQuestion(question.id)}
                                >
                                    <Trash2 />
                                </Button>
                            )}
                        </div>
                        <input
                            type="text"
                            value={question.text}
                            onChange={(e) => updateQuestionText(question.id, e.target.value)}
                            placeholder="Type your question..."
                            className="mt-2 h-9 w-full rounded-lg border border-border/60 bg-card px-3 text-sm outline-none focus:border-primary"
                        />

                        <div className="mt-3 space-y-2">
                            {question.options.map((option, oIndex) => (
                                <div key={option.id} className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 text-[11px] text-muted-foreground">
                                        {String.fromCharCode(65 + oIndex)}
                                    </span>
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => updateOptionText(question.id, option.id, e.target.value)}
                                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                        className="h-8 flex-1 rounded-lg border border-border/60 bg-card px-3 text-sm outline-none focus:border-primary"
                                    />
                                    {question.options.length > 2 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="rounded-full"
                                            onClick={() => removeOption(question.id, option.id)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {question.options.length < 8 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3 rounded-full"
                                onClick={() => addOption(question.id)}
                            >
                                <Plus />
                                Add option
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            <Button type="button" variant="outline" size="sm" className="mt-4 rounded-full" onClick={addQuestion}>
                <Plus />
                Add question
            </Button>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                <p className="text-xs text-muted-foreground">
                    {isValid ? "Ready to generate." : "Each question needs text and at least 2 filled-in options."}
                </p>
                <Button type="button" className="rounded-full" onClick={handleCreate} disabled={!isValid || isCreating}>
                    {isCreating ? <Loader2 className="animate-spin" /> : <Plus />}
                    {isCreating ? "Creating..." : "Create quiz PDF"}
                </Button>
            </div>
        </div>
    )
}
