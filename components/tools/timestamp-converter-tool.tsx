"use client"

import { useMemo, useState } from "react"
import { Clock3 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/tools/copy-button"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"

type Unit = "seconds" | "milliseconds"

function pad(n: number) {
    return String(n).padStart(2, "0")
}

function toLocalInputValue(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
        date.getHours()
    )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function relativeLabel(date: Date) {
    const diffMs = date.getTime() - Date.now()
    const diffSec = Math.round(diffMs / 1000)
    const abs = Math.abs(diffSec)

    const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ["year", 31536000],
        ["month", 2592000],
        ["day", 86400],
        ["hour", 3600],
        ["minute", 60],
        ["second", 1],
    ]

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

    for (const [unit, secondsInUnit] of units) {
        if (abs >= secondsInUnit || unit === "second") {
            return rtf.format(Math.round(diffSec / secondsInUnit), unit)
        }
    }

    return rtf.format(diffSec, "second")
}

export function TimestampConverterTool() {
    const [unit, setUnit] = useState<Unit>("seconds")
    const [unixInput, setUnixInput] = useState(() => String(Math.floor(Date.now() / 1000)))

    const date = useMemo(() => {
        if (!unixInput.trim()) return null
        const n = Number(unixInput)
        if (Number.isNaN(n)) return null
        const ms = unit === "seconds" ? n * 1000 : n
        const parsed = new Date(ms)
        return Number.isNaN(parsed.getTime()) ? null : parsed
    }, [unixInput, unit])

    const localInput = useMemo(() => (date ? toLocalInputValue(date) : ""), [date])

    function handleUnitChange(nextUnit: Unit) {
        const n = Number(unixInput)
        if (!Number.isNaN(n)) {
            const ms = unit === "seconds" ? n * 1000 : n
            setUnixInput(String(nextUnit === "seconds" ? Math.floor(ms / 1000) : ms))
        }
        setUnit(nextUnit)
    }

    function handleLocalChange(value: string) {
        const parsed = new Date(value)
        if (!Number.isNaN(parsed.getTime())) {
            setUnixInput(String(unit === "seconds" ? Math.floor(parsed.getTime() / 1000) : parsed.getTime()))
        }
    }

    function handleNow() {
        setUnit("seconds")
        setUnixInput(String(Math.floor(Date.now() / 1000)))
    }

    const rows = date
        ? [
            { label: "ISO 8601", value: date.toISOString() },
            { label: "UTC", value: date.toUTCString() },
            { label: "Local", value: date.toString() },
            { label: "Relative", value: relativeLabel(date) },
        ]
        : []

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Timestamp Converter</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Convert between Unix timestamps and human-readable dates instantly.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Unix timestamp</p>
                        <ToolSegmentedControl
                            value={unit}
                            onChange={handleUnitChange}
                            options={[
                                { value: "seconds", label: "Seconds" },
                                { value: "milliseconds", label: "Milliseconds" },
                            ]}
                        />
                    </div>
                    <Input
                        value={unixInput}
                        onChange={(e) => setUnixInput(e.target.value)}
                        placeholder="e.g. 1735689600"
                        className="h-10 rounded-2xl px-4 text-sm"
                        inputMode="numeric"
                    />

                    <p className="text-sm font-medium">Date & time (local)</p>
                    <Input
                        type="datetime-local"
                        step={1}
                        value={localInput}
                        onChange={(e) => handleLocalChange(e.target.value)}
                        className="h-10 rounded-2xl px-4 text-sm"
                    />

                    <Button type="button" variant="secondary" className="w-full rounded-full sm:w-auto" onClick={handleNow}>
                        <Clock3 />
                        Use current time
                    </Button>
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Formats</p>
                    <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-4">
                        {date ? (
                            rows.map((row) => (
                                <div
                                    key={row.label}
                                    className="flex flex-col gap-1 border-b border-border/50 pb-2 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
                                    <div className="flex items-center justify-between gap-2">
                                        <code className="overflow-x-auto text-xs break-all">{row.value}</code>
                                        <CopyButton
                                            value={row.value}
                                            label=""
                                            variant="ghost"
                                            className="w-auto shrink-0 px-2"
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">Enter a valid timestamp or date.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
