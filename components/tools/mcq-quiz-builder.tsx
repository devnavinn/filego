"use client"

import { useMemo, useState } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { McqQuiz } from "@/lib/pdf-form-types"

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
