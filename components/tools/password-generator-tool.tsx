"use client"

import { useState } from "react"
import { RefreshCw, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { CopyButton } from "@/components/tools/copy-button"

const CHARSETS = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
}

const AMBIGUOUS = "Il1O0"

function generatePassword(
    length: number,
    options: { uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean; excludeAmbiguous: boolean }
) {
    let charset = ""
    if (options.uppercase) charset += CHARSETS.uppercase
    if (options.lowercase) charset += CHARSETS.lowercase
    if (options.numbers) charset += CHARSETS.numbers
    if (options.symbols) charset += CHARSETS.symbols

    if (options.excludeAmbiguous) {
        charset = charset
            .split("")
            .filter((c) => !AMBIGUOUS.includes(c))
            .join("")
    }

    if (!charset) return ""

    const values = crypto.getRandomValues(new Uint32Array(length))
    return Array.from(values, (v) => charset[v % charset.length]).join("")
}

function estimateStrength(length: number, charsetSize: number) {
    if (charsetSize === 0) return { label: "None", level: 0 }
    const bits = Math.log2(charsetSize) * length
    if (bits < 40) return { label: "Weak", level: 1 }
    if (bits < 70) return { label: "Fair", level: 2 }
    if (bits < 100) return { label: "Strong", level: 3 }
    return { label: "Very strong", level: 4 }
}

export function PasswordGeneratorTool() {
    const [length, setLength] = useState(16)
    const [uppercase, setUppercase] = useState(true)
    const [lowercase, setLowercase] = useState(true)
    const [numbers, setNumbers] = useState(true)
    const [symbols, setSymbols] = useState(false)
    const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
    const [password, setPassword] = useState("")

    const options = { uppercase, lowercase, numbers, symbols, excludeAmbiguous }

    function handleGenerate() {
        setPassword(generatePassword(length, options))
    }

    let charsetSize = 0
    if (uppercase) charsetSize += 26
    if (lowercase) charsetSize += 26
    if (numbers) charsetSize += 10
    if (symbols) charsetSize += CHARSETS.symbols.length

    const strength = estimateStrength(length, charsetSize)
    const noCharsetSelected = charsetSize === 0

    const StrengthIcon = strength.level >= 3 ? ShieldCheck : strength.level === 2 ? ShieldQuestion : ShieldAlert

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Password Generator</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Generate cryptographically secure random passwords, right in your browser.
            </p>

            <div className="mt-6 space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-3">
                    <code className="min-w-0 overflow-x-auto text-sm break-all">
                        {password || "Click “Generate” to create a password"}
                    </code>
                    <CopyButton value={password} label="" variant="ghost" className="w-auto shrink-0 px-2" />
                </div>
                {password && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <StrengthIcon className="h-3.5 w-3.5" />
                        {strength.label}
                    </div>
                )}
            </div>

            <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Length — {length} characters</p>
                    <Slider value={[length]} onValueChange={([v]) => setLength(v)} min={6} max={64} step={1} />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <label className="flex items-center gap-2 text-xs font-medium">
                        <input
                            type="checkbox"
                            checked={uppercase}
                            onChange={(e) => setUppercase(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-border"
                        />
                        A-Z
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium">
                        <input
                            type="checkbox"
                            checked={lowercase}
                            onChange={(e) => setLowercase(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-border"
                        />
                        a-z
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium">
                        <input
                            type="checkbox"
                            checked={numbers}
                            onChange={(e) => setNumbers(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-border"
                        />
                        0-9
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium">
                        <input
                            type="checkbox"
                            checked={symbols}
                            onChange={(e) => setSymbols(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-border"
                        />
                        !@#$
                    </label>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={excludeAmbiguous}
                        onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-border"
                    />
                    Exclude ambiguous characters (I, l, 1, O, 0)
                </label>

                <Button
                    type="button"
                    className="w-full rounded-full sm:w-auto"
                    onClick={handleGenerate}
                    disabled={noCharsetSelected}
                >
                    <RefreshCw />
                    Generate new password
                </Button>
            </div>
        </div>
    )
}
