"use client"

import { Fragment, useMemo, useState } from "react"
import { Regex } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/tools/copy-button"

type MatchInfo = {
    text: string
    index: number
    groups: string[]
}

const FLAG_OPTIONS = ["g", "i", "m", "s", "u"] as const

function runRegex(pattern: string, flags: string, testString: string) {
    if (!pattern) return { matches: [] as MatchInfo[], error: null as string | null, regex: null as RegExp | null }

    try {
        const regex = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`)
        const matches: MatchInfo[] = []
        let match: RegExpExecArray | null
        let guard = 0

        while ((match = regex.exec(testString)) !== null && guard < 1000) {
            matches.push({
                text: match[0],
                index: match.index,
                groups: match.slice(1).map((group) => group ?? ""),
            })

            if (match[0].length === 0) regex.lastIndex += 1
            guard += 1
        }

        return { matches, error: null, regex }
    } catch (err) {
        return { matches: [], error: err instanceof Error ? err.message : "Invalid regular expression", regex: null }
    }
}

export function RegexTesterTool() {
    const [pattern, setPattern] = useState("[a-z]+@[a-z]+\\.[a-z]{2,}")
    const [flags, setFlags] = useState("gi")
    const [testString, setTestString] = useState(
        "Reach support at help@filego.in or sales@filego.in for questions."
    )

    const { matches, error } = useMemo(
        () => runRegex(pattern, flags, testString),
        [pattern, flags, testString]
    )

    const highlighted = useMemo(() => {
        if (error || matches.length === 0) return null

        const segments: { text: string; isMatch: boolean; key: string }[] = []
        let cursor = 0

        matches.forEach((match, i) => {
            if (match.index > cursor) {
                segments.push({ text: testString.slice(cursor, match.index), isMatch: false, key: `t-${i}` })
            }
            segments.push({ text: match.text, isMatch: true, key: `m-${i}` })
            cursor = match.index + match.text.length
        })

        if (cursor < testString.length) {
            segments.push({ text: testString.slice(cursor), isMatch: false, key: "t-end" })
        }

        return segments
    }, [matches, testString, error])

    function toggleFlag(flag: string) {
        setFlags((prev) => (prev.includes(flag) ? prev.replace(flag, "") : prev + flag))
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Regex Tester</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Test regular expressions against sample text with live match highlighting.
            </p>

            <div className="mt-6 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-center gap-2 rounded-2xl border border-input bg-input/20 px-3 py-2 dark:bg-input/30">
                        <span className="text-muted-foreground">/</span>
                        <input
                            value={pattern}
                            onChange={(e) => setPattern(e.target.value)}
                            placeholder="Enter regex pattern"
                            className="w-full bg-transparent text-sm outline-none"
                            spellCheck={false}
                        />
                        <span className="text-muted-foreground">/{flags}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {FLAG_OPTIONS.map((flag) => (
                        <button
                            key={flag}
                            type="button"
                            onClick={() => toggleFlag(flag)}
                            className={`h-7 w-7 rounded-full border text-xs font-medium transition-colors ${flags.includes(flag)
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border/60 text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {flag}
                        </button>
                    ))}
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <p className="text-sm font-medium">Test string</p>
                    <Textarea
                        value={testString}
                        onChange={(e) => setTestString(e.target.value)}
                        placeholder="Paste text to test against"
                        className="min-h-40 rounded-2xl sm:min-h-56"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                            {matches.length} match{matches.length === 1 ? "" : "es"}
                        </p>
                        <CopyButton value={`/${pattern}/${flags}`} label="Copy regex" variant="ghost" className="sm:w-auto" />
                    </div>
                    <div className="min-h-40 space-y-3 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 p-4 sm:min-h-56 sm:max-h-56">
                        <p className="overflow-x-auto break-all whitespace-pre-wrap text-xs leading-6">
                            {highlighted ? (
                                highlighted.map((segment) =>
                                    segment.isMatch ? (
                                        <mark
                                            key={segment.key}
                                            className="rounded bg-teal-500/25 px-0.5 text-foreground"
                                        >
                                            {segment.text}
                                        </mark>
                                    ) : (
                                        <Fragment key={segment.key}>{segment.text}</Fragment>
                                    )
                                )
                            ) : (
                                <span className="text-muted-foreground">
                                    {error ? "Fix the pattern to see matches." : "No matches yet."}
                                </span>
                            )}
                        </p>

                        {matches.length > 0 && (
                            <div className="space-y-1.5 border-t border-border/60 pt-3">
                                {matches.slice(0, 20).map((match, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <Regex className="mt-0.5 h-3 w-3 shrink-0" />
                                        <span className="break-all">
                                            <span className="font-medium text-foreground">{match.text}</span> at index{" "}
                                            {match.index}
                                            {match.groups.length > 0 && ` — groups: ${match.groups.join(", ")}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
