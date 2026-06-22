"use client"

import { useMemo, useState } from "react"
import { KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

function decodeJwtPayload(token: string) {
    try {
        const parts = token.split(".")
        if (parts.length < 2) return null

        const payload = parts[1]
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
        const decoded = atob(normalized)
        return JSON.stringify(JSON.parse(decoded), null, 2)
    } catch {
        return null
    }
}

export function JwtDecoderTool() {
    const [token, setToken] = useState("")

    const decoded = useMemo(() => decodeJwtPayload(token), [token])

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-6">
            <h2 className="text-2xl font-semibold tracking-tight">JWT Decoder</h2>
            <p className="mt-2 text-muted-foreground">
                Paste a JWT token to inspect its payload and claims instantly.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <Textarea
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Paste JWT token here"
                        className="min-h-56 rounded-2xl"
                    />
                    <Button className="rounded-full">
                        <KeyRound className="mr-2 h-4 w-4" />
                        Decode token
                    </Button>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="mb-3 text-sm font-medium">Decoded payload</p>
                    <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-muted-foreground">
                        {decoded ?? "Valid decoded payload will appear here."}
                    </pre>
                </div>
            </div>
        </div>
    )
}