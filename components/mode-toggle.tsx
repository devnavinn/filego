"use client"

import { useTheme } from "next-themes"

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

export function ModeToggle() {
    const { resolvedTheme, setTheme } = useTheme()

    return (
        <AnimatedThemeToggler
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            onThemeChange={setTheme}
            aria-label="Toggle theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:h-4 [&_svg]:w-4"
        />
    )
}