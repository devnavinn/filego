"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Eye, EyeOff, RotateCcw, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { shuffleOptions, type QuizQuestion } from "@/lib/study-set"
import { cn } from "@/lib/utils"

const LETTERS = ["A", "B", "C", "D"]

type QuizPlayerProps = {
    questions: QuizQuestion[]
    rtl?: boolean
}

/** Answer questions one by one with instant feedback, then retry the ones you missed. */
export function QuizPlayer({ questions: initial, rtl }: QuizPlayerProps) {
    const [questions, setQuestions] = useState(initial)
    const [answers, setAnswers] = useState<Record<string, number>>({})
    const [showAll, setShowAll] = useState(false)

    const answered = questions.filter((q) => answers[q.id] !== undefined)
    const correct = answered.filter((q) => answers[q.id] === q.correctIndex)
    const missed = answered.filter((q) => answers[q.id] !== q.correctIndex)
    const finished = answered.length === questions.length
    const percent = questions.length ? Math.round((correct.length / questions.length) * 100) : 0

    const scoreTone = useMemo(
        () => (percent >= 80 ? "text-emerald-600 dark:text-emerald-400" : percent >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"),
        [percent]
    )

    function choose(question: QuizQuestion, index: number) {
        if (answers[question.id] !== undefined || showAll) return
        setAnswers((prev) => ({ ...prev, [question.id]: index }))
    }

    function restart(only?: QuizQuestion[]) {
        const next = (only ?? initial).map(shuffleOptions)
        setQuestions(next)
        setAnswers({})
        setShowAll(false)
    }

    return (
        <div className="space-y-4" dir={rtl ? "rtl" : "ltr"}>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3" dir="ltr">
                <p className="text-sm">
                    <span className="font-medium">{answered.length}</span>
                    <span className="text-muted-foreground"> of {questions.length} answered</span>
                    {answered.length > 0 && (
                        <>
                            <span className="text-muted-foreground"> · </span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">{correct.length} correct</span>
                        </>
                    )}
                </p>
                <div className="flex gap-1.5">
                    <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => setShowAll((v) => !v)}>
                        {showAll ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {showAll ? "Hide answers" : "Show answers"}
                    </Button>
                    {answered.length > 0 && (
                        <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => restart()}>
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restart
                        </Button>
                    )}
                </div>
            </div>

            {finished && !showAll && (
                <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between" dir="ltr">
                    <div>
                        <p className={cn("text-2xl font-semibold tabular-nums", scoreTone)}>
                            {correct.length}/{questions.length} · {percent}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {percent === 100 ? "Perfect score!" : percent >= 80 ? "Great work." : percent >= 50 ? "Good effort. Review the ones you missed." : "Keep practising. Review the explanations below."}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {missed.length > 0 && (
                            <Button type="button" className="rounded-full" onClick={() => restart(missed)}>
                                Retry the {missed.length} I missed
                            </Button>
                        )}
                        <Button type="button" variant="outline" className="rounded-full" onClick={() => restart()}>
                            Retake all (shuffled)
                        </Button>
                    </div>
                </div>
            )}

            <ol className="space-y-3">
                {questions.map((q, qi) => {
                    const chosen = answers[q.id]
                    const revealed = chosen !== undefined || showAll
                    return (
                        <li key={q.id} className="rounded-2xl border border-border/60 bg-card p-4">
                            <p className="text-sm font-medium leading-6">
                                <span className="me-1.5 text-muted-foreground tabular-nums">{qi + 1}.</span>
                                {q.question}
                            </p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {q.options.map((option, oi) => {
                                    const isCorrect = oi === q.correctIndex
                                    const isChosen = oi === chosen
                                    return (
                                        <button
                                            key={oi}
                                            type="button"
                                            onClick={() => choose(q, oi)}
                                            disabled={revealed}
                                            className={cn(
                                                "flex items-start gap-2 rounded-xl border px-3 py-2 text-start text-sm transition-colors",
                                                !revealed && "border-border/60 hover:border-primary/60 hover:bg-primary/5",
                                                revealed && isCorrect && "border-emerald-500/50 bg-emerald-500/10",
                                                revealed && isChosen && !isCorrect && "border-red-500/50 bg-red-500/10",
                                                revealed && !isCorrect && !isChosen && "border-border/40 opacity-60"
                                            )}
                                        >
                                            <span className="font-medium text-muted-foreground">{LETTERS[oi]}</span>
                                            <span className="flex-1">{option}</span>
                                            {revealed && isCorrect && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />}
                                            {revealed && isChosen && !isCorrect && <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
                                        </button>
                                    )
                                })}
                            </div>
                            {revealed && (q.explanation || q.quote) && (
                                <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3 text-sm text-muted-foreground">
                                    {q.explanation && <p>{q.explanation}</p>}
                                    {q.quote && (
                                        <p className="border-s-2 border-primary/40 ps-3 text-xs italic">
                                            “{q.quote}”{q.page ? <span className="not-italic"> (page {q.page})</span> : null}
                                        </p>
                                    )}
                                    {!q.quote && q.page && <p className="text-xs">See page {q.page}.</p>}
                                </div>
                            )}
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}
