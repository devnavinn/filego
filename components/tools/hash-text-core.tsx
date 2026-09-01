"use client"

import { useEffect, useState } from "react"
import { md5 } from "js-md5"
import { Hash } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/tools/copy-button"

const ALGORITHMS = [
    { label: "MD5", value: "MD5" as const },
    { label: "SHA-1", value: "SHA-1" as const },
    { label: "SHA-256", value: "SHA-256" as const },
    { label: "SHA-384", value: "SHA-384" as const },
    { label: "SHA-512", value: "SHA-512" as const },
]

function toHex(buffer: ArrayBuffer) {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
}

async function hashAll(text: string) {
    const bytes = new TextEncoder().encode(text)
    const results: Record<string, string> = { MD5: md5(bytes) }

    for (const algo of ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const) {
        const digest = await crypto.subtle.digest(algo, bytes)
        results[algo] = toHex(digest)
    }

    return results
}

type HashTextCoreProps = {
    title: string
    description: string
}

export function HashTextCore({ title, description }: HashTextCoreProps) {
    const [input, setInput] = useState("Filego")
    const [hashes, setHashes] = useState<Record<string, string>>({})

    useEffect(() => {
        let cancelled = false
        hashAll(input).then((results) => {
            if (!cancelled) setHashes(results)
        })
        return () => {
            cancelled = true
        }
    }, [input])

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">{description}</p>

            <div className="mt-6 space-y-3">
                <p className="text-sm font-medium">Input</p>
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type or paste text to hash"
                    className="min-h-32 rounded-2xl"
                />
            </div>

            <div className="mt-6 space-y-2">
                {ALGORITHMS.map((algo) => (
                    <div
                        key={algo.value}
                        className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Hash className="h-3.5 w-3.5" />
                            {algo.label}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <code className="overflow-x-auto text-xs break-all">
                                {hashes[algo.value] ?? "..."}
                            </code>
                            <CopyButton
                                value={hashes[algo.value] ?? ""}
                                label=""
                                variant="ghost"
                                className="w-auto shrink-0 px-2"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
