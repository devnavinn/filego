"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

const noopSubscribe = () => () => {}

/** False during SSR and hydration, true afterwards — without a setState-in-effect re-render. */
function useHydrated() {
    return useSyncExternalStore(
        noopSubscribe,
        () => true,
        () => false
    )
}

export function ModeToggle() {
    const { resolvedTheme, setTheme } = useTheme()
    const hydrated = useHydrated()

    // The server can't know the stored theme, so render the same icon it did
    // until hydration finishes; otherwise dark-mode users get a hydration mismatch.
    const theme = hydrated && resolvedTheme === "dark" ? "dark" : "light"

    return (
        <AnimatedThemeToggler
            theme={theme}
            onThemeChange={setTheme}
            aria-label="Toggle theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:h-4 [&_svg]:w-4"
        />
    )
}
