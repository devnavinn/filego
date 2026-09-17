"use client"

import { useMemo, useState } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/tools/copy-button"

const STOPWORDS = new Set([
    "a", "an", "the", "and", "or", "but", "is", "are", "was", "were", "be", "been",
    "being", "to", "of", "in", "on", "at", "for", "with", "as", "by", "that", "this",
    "it", "its", "from", "not", "no", "so", "if", "then", "than", "i", "you", "he",
    "she", "we", "they", "my", "your", "his", "her", "our", "their", "do", "does",
    "did", "have", "has", "had", "will", "would", "can", "could", "should", "may",
    "might", "must", "there", "here", "what", "which", "who", "whom", "these",
    "those", "am", "into", "about", "up", "out", "just", "also",
])

const SAMPLE_TEXT =
    "Filego helps you compress, convert, and merge files fast. All processing happens in your browser, so your files stay private while you work."

function countWords(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return 0
    return trimmed.split(/\s+/).length
}

function countSentences(text: string) {
    const matches = text.match(/[^.!?]+[.!?]+/g)
    if (matches) return matches.length
    return text.trim() ? 1 : 0
}

function countParagraphs(text: string) {
    const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean)
    return paragraphs.length
}

function topWords(text: string, limit: number) {
    const matches = text.toLowerCase().match(/[a-z0-9']+/g)
    if (!matches) return []

    const counts = new Map<string, number>()
    for (const word of matches) {
        if (word.length < 3 || STOPWORDS.has(word)) continue
        counts.set(word, (counts.get(word) ?? 0) + 1)
    }

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
}

export function WordCounterTool() {
    const [text, setText] = useState(SAMPLE_TEXT)

    const stats = useMemo(() => {
        const words = countWords(text)
        return {
            words,
            charactersWithSpaces: text.length,
            charactersNoSpaces: text.replace(/\s/g, "").length,
            sentences: countSentences(text),
            paragraphs: countParagraphs(text),
            readingMinutes: Math.max(1, Math.ceil(words / 200)),
            speakingMinutes: Math.max(1, Math.ceil(words / 130)),
        }
    }, [text])

    const frequentWords = useMemo(() => topWords(text, 5), [text])
    const maxFrequency = frequentWords[0]?.[1] ?? 1

    const statCards = [
        { label: "Words", value: stats.words },
        { label: "Characters", value: stats.charactersWithSpaces },
        { label: "Characters (no spaces)", value: stats.charactersNoSpaces },
        { label: "Sentences", value: stats.sentences },
        { label: "Paragraphs", value: stats.paragraphs },
        { label: "Reading time", value: `${stats.readingMinutes} min` },
        { label: "Speaking time", value: `${stats.speakingMinutes} min` },
    ]

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Word Counter</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Count words, characters, sentences, and paragraphs as you type — all in your browser.
            </p>

            <div className="mt-6 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Your text</p>
                <div className="flex items-center gap-1.5">
                    <CopyButton value={text} label="Copy" variant="ghost" className="sm:w-auto" />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setText("")} disabled={!text}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear
                    </Button>
                </div>
            </div>

            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type your text here..."
                className="mt-3 min-h-56 rounded-2xl sm:min-h-72"
            />

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {statCards.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-border/60 bg-muted/30 p-3.5">
                        <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                            {stat.value}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
            </div>

            {frequentWords.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Most frequent words
                    </p>
                    <div className="mt-2 space-y-1.5">
                        {frequentWords.map(([word, count]) => (
                            <div key={word} className="flex items-center gap-3">
                                <span className="w-24 shrink-0 truncate text-sm text-foreground">{word}</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-foreground/70"
                                        style={{ width: `${(count / maxFrequency) * 100}%` }}
                                    />
                                </div>
                                <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
