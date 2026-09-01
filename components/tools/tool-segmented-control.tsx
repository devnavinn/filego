"use client"

import { cn } from "@/lib/utils"

type SegmentedControlProps<T extends string> = {
    value: T
    onChange: (value: T) => void
    options: { value: T; label: string }[]
    className?: string
}

export function ToolSegmentedControl<T extends string>({
    value,
    onChange,
    options,
    className,
}: SegmentedControlProps<T>) {
    return (
        <div
            className={cn(
                "inline-flex w-full items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1 sm:w-auto",
                className
            )}
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={cn(
                        "flex-1 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:flex-none",
                        value === option.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}
