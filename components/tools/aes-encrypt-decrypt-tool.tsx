"use client"

import { useState } from "react"
import { Eye, EyeOff, Lock, Unlock } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/tools/copy-button"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"

type Mode = "encrypt" | "decrypt"

const SALT_LENGTH = 16
const IV_LENGTH = 12
const PBKDF2_ITERATIONS = 150_000

function bytesToBase64(bytes: Uint8Array) {
    let binary = ""
    bytes.forEach((b) => (binary += String.fromCharCode(b)))
    return btoa(binary)
}

function base64ToBytes(b64: string) {
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

async function deriveKey(passphrase: string, salt: Uint8Array) {
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(passphrase),
        "PBKDF2",
        false,
        ["deriveKey"]
    )

    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: new Uint8Array(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    )
}

async function encrypt(text: string, passphrase: string) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    const key = await deriveKey(passphrase, salt)

    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text))

    const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length)

    return bytesToBase64(combined)
}

async function decrypt(payload: string, passphrase: string) {
    const combined = base64ToBytes(payload)
    if (combined.length < SALT_LENGTH + IV_LENGTH) throw new Error("That doesn't look like encrypted data.")

    const salt = combined.slice(0, SALT_LENGTH)
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH)

    const key = await deriveKey(passphrase, salt)
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext)
    return new TextDecoder().decode(plaintext)
}

export function AesEncryptDecryptTool() {
    const [mode, setMode] = useState<Mode>("encrypt")
    const [passphrase, setPassphrase] = useState("")
    const [showPassphrase, setShowPassphrase] = useState(false)
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleProcess() {
        if (!input.trim() || !passphrase) return
        setIsProcessing(true)
        setError(null)
        setOutput("")

        try {
            const result = mode === "encrypt" ? await encrypt(input, passphrase) : await decrypt(input, passphrase)
            setOutput(result)
        } catch {
            setError(
                mode === "encrypt"
                    ? "Could not encrypt this text."
                    : "Could not decrypt — check your passphrase and the encrypted text."
            )
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">AES Encrypt / Decrypt</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Encrypt or decrypt text with AES-256-GCM using a passphrase — everything happens in your browser.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <ToolSegmentedControl
                    value={mode}
                    onChange={(v) => {
                        setMode(v)
                        setOutput("")
                        setError(null)
                    }}
                    options={[
                        { value: "encrypt", label: "Encrypt" },
                        { value: "decrypt", label: "Decrypt" },
                    ]}
                />

                <div className="relative w-full sm:w-64">
                    <Input
                        type={showPassphrase ? "text" : "password"}
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        placeholder="Passphrase"
                        className="h-9 rounded-full pr-9"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassphrase((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                    >
                        {showPassphrase ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <p className="text-sm font-medium">{mode === "encrypt" ? "Plain text" : "Encrypted text"}</p>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={mode === "encrypt" ? "Text to encrypt" : "Paste encrypted text here"}
                        className="min-h-40 rounded-2xl sm:min-h-56"
                    />
                    <Button
                        type="button"
                        className="w-full rounded-full sm:w-auto"
                        onClick={handleProcess}
                        disabled={isProcessing || !input.trim() || !passphrase}
                    >
                        {mode === "encrypt" ? <Lock /> : <Unlock />}
                        {isProcessing ? "Working..." : mode === "encrypt" ? "Encrypt" : "Decrypt"}
                    </Button>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Result</p>
                        <CopyButton value={output} label="Copy" variant="ghost" className="sm:w-auto" />
                    </div>
                    <div className="min-h-40 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:min-h-56">
                        {error ? (
                            <p className="text-sm text-destructive">{error}</p>
                        ) : (
                            <pre className="overflow-x-auto break-all whitespace-pre-wrap text-xs text-muted-foreground">
                                {output || "Your result will appear here."}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
