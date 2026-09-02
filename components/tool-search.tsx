"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Search, Sparkles, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { categoryIconMap, getAllTools } from "@/lib/tools-data"

const MAX_RESULTS = 8

const allTools = getAllTools()

type ToolSearchProps = {
    variant?: "nav" | "hero"
    className?: string
    placeholder?: string
}

export function ToolSearch({ variant = "nav", className, placeholder }: ToolSearchProps) {
    const [query, setQuery] = useState("")
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const matches = useMemo(() => {
        const term = query.trim().toLowerCase()
        if (!term) return []

        return allTools.filter(
            (tool) =>
                tool.name.toLowerCase().includes(term) ||
                tool.shortDescription.toLowerCase().includes(term) ||
                tool.categoryTitle.toLowerCase().includes(term)
        )
    }, [query])

    const results = matches.slice(0, MAX_RESULTS)
    const totalMatches = matches.length

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false)
        }

        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("keydown", handleEscape)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("keydown", handleEscape)
        }
    }, [])

    const showPanel = open && query.trim().length > 0

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder ?? "Search 74+ tools…"}
                    className={cn(
                        "rounded-full pl-9",
                        variant === "hero" ? "h-12 text-base pr-9" : "h-9 pr-9"
                    )}
                    aria-label="Search tools"
                />
                {query ? (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery("")
                            setOpen(false)
                        }}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Clear search"
                    >
                        <X className="h-4 w-4" />
                    </button>
                ) : null}
            </div>

            {showPanel ? (
                <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-[320px] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
                    {results.length > 0 ? (
                        <>
                            <div className="max-h-[60vh] overflow-y-auto p-2">
                                {results.map((tool) => {
                                    const Icon = categoryIconMap[tool.categorySlug] ?? Sparkles

                                    return (
                                        <Link
                                            key={`${tool.categorySlug}-${tool.slug}`}
                                            href={`/tools/${tool.categorySlug}/${tool.slug}`}
                                            onClick={() => setOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted"
                                        >
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <Icon className="h-4 w-4 text-foreground" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium text-foreground">
                                                    {tool.name}
                                                </span>
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {tool.shortDescription}
                                                </span>
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="hidden shrink-0 rounded-full text-[10px] sm:inline-flex"
                                            >
                                                {tool.categoryTitle}
                                            </Badge>
                                        </Link>
                                    )
                                })}
                            </div>

                            {totalMatches > results.length ? (
                                <Link
                                    href="/tools"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                >
                                    View all {totalMatches} results in Tools
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            ) : null}
                        </>
                    ) : (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            No tools found for &ldquo;{query}&rdquo;.
                            <Link href="/tools" onClick={() => setOpen(false)} className="mt-2 block font-medium text-foreground hover:underline">
                                Browse all tools
                            </Link>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    )
}
