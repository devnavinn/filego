"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

import { usePlan } from "@/hooks/use-plan";
import { cn } from "@/lib/utils";

declare global {
    interface Window {
        adsbygoogle?: unknown[];
    }
}

const ADSENSE_CLIENT = "ca-pub-4796389804860566";

/** Ad unit IDs from AdSense → Ads → By ad unit. A placement without an ID renders nothing. */
const SLOT_IDS = {
    tool: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL,
    category: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY,
    blog: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG,
} as const;

type AdSlotProps = {
    placement: keyof typeof SLOT_IDS;
    className?: string;
};

/**
 * A responsive AdSense unit shown only to guests and free users.
 * The AdSense script is loaded on first use, so Pro users never download it.
 * Space is reserved while the plan loads to avoid layout shift.
 */
export function AdSlot({ placement, className }: AdSlotProps) {
    const { tier, loading } = usePlan();
    const pathname = usePathname();
    const slotId = SLOT_IDS[placement];

    if (!slotId || tier === "pro") return null;

    return (
        <div className={cn("mx-auto w-full max-w-5xl", className)}>
            <p className="mb-1 text-center text-[10px] font-medium tracking-[0.18em] text-muted-foreground/70 uppercase">
                Advertisement
            </p>
            <div className="min-h-[100px] overflow-hidden rounded-2xl sm:min-h-[120px]">
                {loading ? null : <AdUnit key={pathname} slotId={slotId} />}
            </div>
        </div>
    );
}

function AdUnit({ slotId }: { slotId: string }) {
    const pushed = useRef(false);

    useEffect(() => {
        // Guard against React strict mode running the effect twice.
        if (pushed.current) return;
        pushed.current = true;
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (error) {
            console.error("[ADSENSE_PUSH_ERROR]", error);
        }
    }, []);

    return (
        <>
            <Script
                id="adsbygoogle-js"
                src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
                strategy="afterInteractive"
                crossOrigin="anonymous"
            />
            <ins
                className="adsbygoogle block"
                data-ad-client={ADSENSE_CLIENT}
                data-ad-slot={slotId}
                data-ad-format="auto"
                data-full-width-responsive="true"
                {...(process.env.NODE_ENV !== "production" ? { "data-adtest": "on" } : {})}
            />
        </>
    );
}
