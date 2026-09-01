"use client"

import { useMemo, useState } from "react"
import { format, type SqlLanguage } from "sql-formatter"
import { Sparkles } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/tools/copy-button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const DIALECTS: { value: SqlLanguage; label: string }[] = [
    { value: "sql", label: "Standard SQL" },
    { value: "mysql", label: "MySQL" },
    { value: "postgresql", label: "PostgreSQL" },
    { value: "mariadb", label: "MariaDB" },
    { value: "sqlite", label: "SQLite" },
    { value: "transactsql", label: "SQL Server (T-SQL)" },
    { value: "bigquery", label: "BigQuery" },
    { value: "redshift", label: "Redshift" },
    { value: "snowflake", label: "Snowflake" },
]

const SAMPLE = "select id, name, email from users where status = 'active' and created_at > '2026-01-01' order by created_at desc limit 20;"

export function SqlFormatterTool() {
    const [input, setInput] = useState(SAMPLE)
    const [dialect, setDialect] = useState<SqlLanguage>("postgresql")
    const [keywordCase, setKeywordCase] = useState<"preserve" | "upper" | "lower">("upper")

    const { output, error } = useMemo(() => {
        if (!input.trim()) return { output: "", error: null as string | null }

        try {
            return {
                output: format(input, { language: dialect, keywordCase, tabWidth: 2 }),
                error: null,
            }
        } catch (err) {
            return { output: "", error: err instanceof Error ? err.message : "Could not format this query." }
        }
    }, [input, dialect, keywordCase])

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">SQL Formatter</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Beautify SQL queries with dialect-aware formatting for readability.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex-1 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Dialect</p>
                    <Select value={dialect} onValueChange={(v) => setDialect(v as SqlLanguage)}>
                        <SelectTrigger className="w-full rounded-full sm:w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DIALECTS.map((d) => (
                                <SelectItem key={d.value} value={d.value}>
                                    {d.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Keyword case</p>
                    <Select value={keywordCase} onValueChange={(v) => setKeywordCase(v as typeof keywordCase)}>
                        <SelectTrigger className="w-full rounded-full sm:w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="preserve">Preserve</SelectItem>
                            <SelectItem value="upper">UPPERCASE</SelectItem>
                            <SelectItem value="lower">lowercase</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <p className="text-sm font-medium">Raw SQL</p>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste a SQL query"
                        className="min-h-56 rounded-2xl font-mono sm:min-h-72"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Formatted</p>
                        <CopyButton value={output} label="Copy" variant="ghost" className="sm:w-auto" />
                    </div>
                    <div className="min-h-56 overflow-auto rounded-2xl border border-border/60 bg-muted/30 p-4 sm:min-h-72">
                        {error ? (
                            <p className="text-sm text-destructive">{error}</p>
                        ) : (
                            <pre className="font-mono text-xs whitespace-pre text-muted-foreground">
                                {output || (
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Formatted SQL will appear here.
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
