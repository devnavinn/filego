"use client"

import { useMemo, useState } from "react"
import { js_beautify } from "js-beautify/js/lib/beautify"
import { css_beautify } from "js-beautify/js/lib/beautify-css"
import { html_beautify } from "js-beautify/js/lib/beautify-html"
import { Wand2 } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/tools/copy-button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Language = "javascript" | "json" | "css" | "html"

const LANGUAGES: { value: Language; label: string }[] = [
    { value: "javascript", label: "JavaScript / TypeScript" },
    { value: "json", label: "JSON" },
    { value: "css", label: "CSS" },
    { value: "html", label: "HTML" },
]

const SAMPLES: Record<Language, string> = {
    javascript: "function greet(name){if(!name){return 'Hello, world!';}return `Hello, ${name}!`;}",
    json: '{"name":"Filego","tools":["compress","merge","split"],"active":true}',
    css: ".card{display:flex;align-items:center;padding:12px;border-radius:16px;}",
    html: "<div class=\"card\"><h2>Title</h2><p>Some description text.</p></div>",
}

function beautify(input: string, language: Language, indentSize: number) {
    if (!input.trim()) return { output: "", error: null as string | null }

    try {
        if (language === "json") {
            return { output: JSON.stringify(JSON.parse(input), null, indentSize), error: null }
        }

        if (language === "css") {
            return { output: css_beautify(input, { indent_size: indentSize }), error: null }
        }

        if (language === "html") {
            return { output: html_beautify(input, { indent_size: indentSize }), error: null }
        }

        return { output: js_beautify(input, { indent_size: indentSize }), error: null }
    } catch (err) {
        return { output: "", error: err instanceof Error ? err.message : "Could not beautify this code." }
    }
}

export function CodeBeautifierTool() {
    const [language, setLanguage] = useState<Language>("javascript")
    const [indentSize, setIndentSize] = useState(2)
    const [input, setInput] = useState(SAMPLES.javascript)

    const { output, error } = useMemo(
        () => beautify(input, language, indentSize),
        [input, language, indentSize]
    )

    function handleLanguageChange(value: Language) {
        setLanguage(value)
        setInput(SAMPLES[value])
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Code Beautifier</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Format messy JavaScript, JSON, CSS, or HTML into clean, readable code.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex-1 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Language</p>
                    <Select value={language} onValueChange={(v) => handleLanguageChange(v as Language)}>
                        <SelectTrigger className="w-full rounded-full sm:w-56">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Indent size</p>
                    <Select value={String(indentSize)} onValueChange={(v) => setIndentSize(Number(v))}>
                        <SelectTrigger className="w-full rounded-full sm:w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2">2 spaces</SelectItem>
                            <SelectItem value="4">4 spaces</SelectItem>
                            <SelectItem value="8">8 spaces</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <p className="text-sm font-medium">Input</p>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste code to beautify"
                        className="min-h-56 rounded-2xl font-mono sm:min-h-72"
                        spellCheck={false}
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Beautified</p>
                        <CopyButton value={output} label="Copy" variant="ghost" className="sm:w-auto" />
                    </div>
                    <div className="min-h-56 overflow-auto rounded-2xl border border-border/60 bg-muted/30 p-4 sm:min-h-72">
                        {error ? (
                            <p className="text-sm text-destructive">{error}</p>
                        ) : (
                            <pre className="font-mono text-xs whitespace-pre text-muted-foreground">
                                {output || (
                                    <span className="flex items-center gap-1.5">
                                        <Wand2 className="h-3.5 w-3.5" />
                                        Beautified output will appear here.
                                    </span>
                                )}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
