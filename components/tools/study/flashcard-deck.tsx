"use client"

import { useState } from "react"
import { Check, ChevronLeft, ChevronRight, RotateCcw, Shuffle, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Flashcard } from "@/lib/study-set"
import { cn } from "@/lib/utils"

type FlashcardDeckProps = {
    cards: Flashcard[]
    rtl?: boolean
}

function shuffled<T>(items: T[]): T[] {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
}

/**
 * Flip through cards, sorting each into "Got it" or "Still learning", then review only the
 * ones still being learned. Keyboard: Space flips, ←/→ move, ↑ got it, ↓ still learning.
 */
export function FlashcardDeck({ cards, rtl }: FlashcardDeckProps) {
    const [queue, setQueue] = useState<Flashcard[]>(cards)
    const [position, setPosition] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const [known, setKnown] = useState<Set<string>>(new Set())
    const [learning, setLearning] = useState<Set<string>>(new Set())
    const [round, setRound] = useState(1)

    const done = position >= queue.length
    const card = done ? null : queue[position]
    const knownCount = cards.filter((c) => known.has(c.id)).length

    function go(delta: number) {
        setFlipped(false)
        setPosition((p) => Math.min(Math.max(0, p + delta), queue.length))
    }

    function mark(isKnown: boolean) {
        if (!card) return
        setKnown((prev) => {
            const next = new Set(prev)
            if (isKnown) next.add(card.id)
            else next.delete(card.id)
            return next
        })
        setLearning((prev) => {
            const next = new Set(prev)
            if (isKnown) next.delete(card.id)
            else next.add(card.id)
            return next
        })
        go(1)
    }

    function startRound(next: Flashcard[], resetProgress = false) {
        setQueue(next)
        setPosition(0)
        setFlipped(false)
        if (resetProgress) {
            setKnown(new Set())
            setLearning(new Set())
            setRound(1)
        } else {
            setRound((r) => r + 1)
        }
    }

    function handleKey(event: React.KeyboardEvent) {
        if (event.target instanceof HTMLButtonElement && (event.key === " " || event.key === "Enter")) return
        if (event.key === " " || event.key === "Enter") {
            event.preventDefault()
            if (card) setFlipped((f) => !f)
        } else if (event.key === "ArrowRight") go(1)
        else if (event.key === "ArrowLeft") go(-1)
        else if (event.key === "ArrowUp") {
            event.preventDefault()
            mark(true)
        } else if (event.key === "ArrowDown") {
            event.preventDefault()
            mark(false)
        }
    }

    const stillLearning = cards.filter((c) => learning.has(c.id))

    return (
        <div className="space-y-4 outline-none" tabIndex={0} onKeyDown={handleKey} aria-label="Flashcards">
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        {round > 1 ? `Review round ${round} · ` : ""}
                        Card {Math.min(position + 1, queue.length)} of {queue.length}
                    </span>
                    <span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{knownCount} known</span> ·{" "}
                        <span className="font-medium text-amber-600 dark:text-amber-400">{learning.size} learning</span>
                    </span>
                </div>
                <Progress value={queue.length ? (Math.min(position, queue.length) / queue.length) * 100 : 0} className="h-1.5" />
            </div>

            {card ? (
                <>
                    <button
                        type="button"
                        onClick={() => setFlipped((f) => !f)}
                        className="group block h-64 w-full [perspective:1200px] sm:h-72"
                        aria-label={flipped ? "Show front" : "Show answer"}
                    >
                        <div
                            className={cn(
                                "relative h-full w-full rounded-3xl transition-transform duration-500 [transform-style:preserve-3d]",
                                flipped && "[transform:rotateY(180deg)]"
                            )}
                        >
                            <div
                                className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border/60 bg-card p-6 text-center shadow-sm [backface-visibility:hidden]"
                                dir={rtl ? "rtl" : "ltr"}
                            >
                                <p className="text-lg font-semibold leading-7 text-balance sm:text-xl">{card.front}</p>
                                <p className="text-xs text-muted-foreground">Tap or press Space to flip</p>
                            </div>
                            <div
                                className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto rounded-3xl border border-primary/30 bg-primary/5 p-6 text-center shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]"
                                dir={rtl ? "rtl" : "ltr"}
                            >
                                <p className="text-base leading-7 text-balance">{card.back}</p>
                                {card.page && <p className="text-xs text-muted-foreground">Page {card.page}</p>}
                            </div>
                        </div>
                    </button>

                    <div className="flex items-center justify-between gap-2">
                        <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => go(-1)} disabled={position === 0} aria-label="Previous card">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-1 justify-center gap-2">
                            <Button type="button" variant="outline" className="rounded-full border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400" onClick={() => mark(false)}>
                                <Undo2 className="h-4 w-4" />
                                Still learning
                            </Button>
                            <Button type="button" variant="outline" className="rounded-full border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400" onClick={() => mark(true)}>
                                <Check className="h-4 w-4" />
                                Got it
                            </Button>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => go(1)} aria-label="Next card">
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                    <p className="hidden text-center text-[11px] text-muted-foreground sm:block">
                        Keyboard: Space flip · ← → move · ↑ got it · ↓ still learning
                    </p>
                </>
            ) : (
                <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card p-8 text-center">
                    <p className="text-lg font-semibold">
                        {stillLearning.length === 0 ? "You know all the cards!" : `Round done: ${knownCount} of ${cards.length} known`}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {stillLearning.length > 0 && (
                            <Button type="button" className="rounded-full" onClick={() => startRound(shuffled(stillLearning))}>
                                Review the {stillLearning.length} still learning
                            </Button>
                        )}
                        <Button type="button" variant="outline" className="rounded-full" onClick={() => startRound(cards, true)}>
                            <RotateCcw className="h-4 w-4" />
                            Start over
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex justify-center">
                <Button type="button" variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={() => startRound(shuffled(cards), true)}>
                    <Shuffle className="h-3.5 w-3.5" />
                    Shuffle deck
                </Button>
            </div>
        </div>
    )
}
