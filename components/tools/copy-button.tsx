"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CopyButtonProps = {
    value: string
    label?: string
    className?: string
    variant?: "outline" | "secondary" | "ghost" | "default"
}

export function CopyButton({ value, label = "Copy", className, variant = "outline" }: CopyButtonProps) {
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        if (!value) return

        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            toast.success("Copied to clipboard")
            window.setTimeout(() => setCopied(false), 1500)
        } catch {
            toast.error("Could not copy to clipboard")
        }
    }

    return (
        <Button
            type="button"
            variant={variant}
            className={cn("w-full rounded-full sm:w-auto", className)}
            onClick={handleCopy}
            disabled={!value}
        >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : label}
        </Button>
    )
}
