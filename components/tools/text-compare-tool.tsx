"use client"

import { Fragment, useMemo, useState } from "react"
import { diffLines, diffWordsWithSpace } from "diff"
import { GitCompare } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"

type Mode = "words" | "lines"

const SAMPLE_A = "Filego helps you compress, convert, and merge files fast.\nAll processing happens in your browser."
const SAMPLE_B = "Filego helps you compress, convert, merge, and edit files fast.\nAll processing happens locally in your browser."

export function TextCompareTool() {
    const [original, setOriginal] = useState(SAMPLE_A)
    const [changed, setChanged] = useState(SAMPLE_B)
    const [mode, setMode] = useState<Mode>("words")

    const parts = useMemo(() => {
        if (!original && !changed) return []
        return mode === "words" ? diffWordsWithSpace(original, changed) : diffLines(original, changed)
    }, [original, changed, mode])

    const stats = useMemo(() => {
        let additions = 0
        let deletions = 0
        for (const part of parts) {
            if (part.added) additions += 1
            if (part.removed) deletions += 1
        }
        return { additions, deletions }
    }, [parts])

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Text Compare Tool</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Compare two text blocks and highlight what changed.
            </p>

            <div className="mt-6 flex items-center justify-between">
                <ToolSegmentedControl
                    value={mode}
                    onChange={setMode}
                    options={[
                        { value: "words", label: "Word diff" },
                        { value: "lines", label: "Line diff" },
                    ]}
                />
                <p className="text-xs text-muted-foreground">
                    <span className="text-emerald-600 dark:text-emerald-400">+{stats.additions}</span>
                    {" / "}
                    <span className="text-red-600 dark:text-red-400">-{stats.deletions}</span>
                </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <p className="text-sm font-medium">Original</p>
                    <Textarea
                        value={original}
                        onChange={(e) => setOriginal(e.target.value)}
                        placeholder="Paste the original text"
                        className="min-h-40 rounded-2xl sm:min-h-56"
                    />
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Changed</p>
                    <Textarea
                        value={changed}
                        onChange={(e) => setChanged(e.target.value)}
                        placeholder="Paste the changed text"
                        className="min-h-40 rounded-2xl sm:min-h-56"
                    />
                </div>
            </div>

            <div className="mt-4 space-y-3">
                <p className="text-sm font-medium">Difference</p>
                <div className="min-h-32 overflow-auto rounded-2xl border border-border/60 bg-muted/30 p-4">
                    {parts.length === 0 ? (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <GitCompare className="h-3.5 w-3.5" />
                            Enter text in both boxes to see the difference.
                        </span>
                    ) : (
                        <p className="overflow-x-auto text-xs leading-6 whitespace-pre-wrap">
                            {parts.map((part, i) => (
                                <Fragment key={i}>
                                    {part.added ? (
                                        <mark className="rounded bg-emerald-500/20 px-0.5 text-foreground">
                                            {part.value}
                                        </mark>
                                    ) : part.removed ? (
                                        <mark className="rounded bg-red-500/20 px-0.5 text-foreground line-through">
                                            {part.value}
                                        </mark>
                                    ) : (
                                        <span className="text-muted-foreground">{part.value}</span>
                                    )}
                                </Fragment>
                            ))}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
