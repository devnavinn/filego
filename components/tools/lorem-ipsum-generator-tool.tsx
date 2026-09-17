"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"
import { CopyButton } from "@/components/tools/copy-button"
import { downloadBlob } from "@/lib/image-tool-utils"

const WORDS = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
    "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim",
    "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip",
    "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
    "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat",
    "non", "proident", "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id",
    "est", "laborum", "at", "vero", "eos", "accusamus", "accusantium", "doloremque", "laudantium", "totam",
    "rem", "aperiam", "eaque", "ipsa", "quae", "ab", "illo", "inventore", "veritatis", "quasi",
    "architecto", "beatae", "vitae", "dicta", "explicabo", "nemo", "ipsam", "quia", "voluptas", "aspernatur",
    "aut", "odit", "fugit", "consequuntur", "magni", "dolores", "ratione", "sequi", "nesciunt", "neque",
    "porro", "quisquam", "dolorem", "adipisci", "numquam", "eius", "modi", "tempora", "incidunt", "magnam",
    "quaerat", "etiam", "minus", "nobis", "eligendi", "optio", "cumque", "nihil", "impedit", "quo",
    "maxime", "placeat", "facere", "possimus", "omnis", "assumenda", "repellendus", "temporibus", "autem", "quibusdam",
    "officiis", "debitis", "rerum", "necessitatibus", "saepe", "eveniet", "voluptates", "repudiandae", "recusandae", "itaque",
    "earum", "hic", "tenetur", "sapiente", "delectus", "reiciendis", "voluptatibus", "maiores", "alias", "perferendis",
]

const CLASSIC_OPENING = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit"]

type Unit = "paragraphs" | "sentences" | "words"

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)]
}

function capitalize(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1)
}

function generateSentence(firstWords: string[] = []): string {
    const targetLength = randomInt(6, 16)
    const words = [...firstWords]
    while (words.length < targetLength) words.push(randomWord())
    words[0] = capitalize(words[0])
    return `${words.join(" ")}.`
}

function generateParagraph(sentenceCount: number, firstWords: string[] = []): string {
    const sentences = [generateSentence(firstWords)]
    for (let i = 1; i < sentenceCount; i++) sentences.push(generateSentence())
    return sentences.join(" ")
}

function generateLoremIpsum(unit: Unit, count: number, startClassic: boolean): string[] {
    const safeCount = Math.max(1, Math.min(count, 200))
    const opening = startClassic ? CLASSIC_OPENING : []

    if (unit === "words") {
        const words = [...opening]
        while (words.length < safeCount) words.push(randomWord())
        const trimmed = words.slice(0, safeCount)
        trimmed[0] = capitalize(trimmed[0])
        return [`${trimmed.join(" ")}.`]
    }

    if (unit === "sentences") {
        const sentences = [generateSentence(opening)]
        for (let i = 1; i < safeCount; i++) sentences.push(generateSentence())
        return [sentences.join(" ")]
    }

    const paragraphs: string[] = []
    for (let i = 0; i < safeCount; i++) {
        const sentenceCount = randomInt(3, 7)
        paragraphs.push(generateParagraph(sentenceCount, i === 0 ? opening : []))
    }
    return paragraphs
}

export function LoremIpsumGeneratorTool() {
    const [unit, setUnit] = useState<Unit>("paragraphs")
    const [count, setCount] = useState("5")
    const [startClassic, setStartClassic] = useState(true)
    const [asHtml, setAsHtml] = useState(false)
    // Fixed (non-random) default so server and pre-hydration client markup match exactly;
    // real randomized text is generated client-side only, right after mount.
    const [paragraphs, setParagraphs] = useState<string[]>([
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    ])

    function handleGenerate() {
        const parsed = Number(count)
        const safeCount = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
        setParagraphs(generateLoremIpsum(unit, safeCount, startClassic))
    }

    useEffect(() => {
        // Randomized content can only be generated client-side without causing a
        // hydration mismatch against the fixed server-rendered default above.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setParagraphs(generateLoremIpsum("paragraphs", 5, true))
    }, [])

    const plainText = paragraphs.join("\n\n")
    const outputText = asHtml ? paragraphs.map((p) => `<p>${p}</p>`).join("\n") : plainText

    function handleDownload() {
        downloadBlob(new Blob([outputText], { type: "text/plain" }), asHtml ? "lorem-ipsum.html" : "lorem-ipsum.txt")
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Lorem Ipsum Generator</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Generate placeholder text for mockups, layouts, and designs — in your browser.
            </p>

            <div className="mt-6 flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Generate</p>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min="1"
                            max="200"
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                            className="h-9 w-20 rounded-full"
                        />
                        <ToolSegmentedControl
                            value={unit}
                            onChange={setUnit}
                            options={[
                                { value: "paragraphs", label: "Paragraphs" },
                                { value: "sentences", label: "Sentences" },
                                { value: "words", label: "Words" },
                            ]}
                        />
                    </div>
                </div>

                <Button type="button" className="rounded-full" onClick={handleGenerate}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Generate
                </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={startClassic}
                        onChange={(e) => setStartClassic(e.target.checked)}
                        className="h-3.5 w-3.5 rounded"
                    />
                    Start with &ldquo;Lorem ipsum dolor sit amet...&rdquo;
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={asHtml}
                        onChange={(e) => setAsHtml(e.target.checked)}
                        className="h-3.5 w-3.5 rounded"
                    />
                    Wrap paragraphs in &lt;p&gt; tags
                </label>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <p className="text-sm font-medium">Output</p>
                <div className="flex items-center gap-1.5">
                    <CopyButton value={outputText} label="Copy" variant="ghost" className="sm:w-auto" />
                    <Button type="button" variant="ghost" size="sm" onClick={handleDownload}>
                        Download
                    </Button>
                </div>
            </div>

            <div className="mt-2 max-h-96 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 p-4">
                <p className="text-sm leading-6 whitespace-pre-wrap text-foreground">{outputText}</p>
            </div>
        </div>
    )
}
