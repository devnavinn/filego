"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { subscribeToLimitHits, type LimitHit } from "@/hooks/use-file-limits";
import { PLAN_LIMITS, formatLimitBytes } from "@/lib/plans";

function describe(hit: LimitHit) {
    const lines: string[] = [];

    if (hit.oversized.length === 1) {
        lines.push(`“${hit.oversized[0]}” is over the ${formatLimitBytes(hit.limits.maxFileBytes)} file limit.`);
    } else if (hit.oversized.length > 1) {
        lines.push(`${hit.oversized.length} files are over the ${formatLimitBytes(hit.limits.maxFileBytes)} file limit.`);
    }

    if (hit.overBatch > 0) {
        lines.push(
            `You can add up to ${hit.limits.maxBatchFiles} files at a time, so ${hit.overBatch} ${hit.overBatch === 1 ? "file was" : "files were"} left out.`
        );
    }

    return lines.join(" ");
}

/** Mounted once in the root layout. Opens whenever a tool drops files over the plan's limits. */
export function LimitReachedDialog() {
    const [hit, setHit] = useState<LimitHit | null>(null);

    useEffect(() => subscribeToLimitHits(setHit), []);

    const isGuest = hit?.tier === "guest";

    return (
        <Dialog open={hit !== null} onOpenChange={(open) => !open && setHit(null)}>
            <DialogContent>
                {hit ? (
                    <>
                        <div className="bg-gradient-brand mb-4 flex size-11 items-center justify-center rounded-2xl text-white">
                            <Crown className="size-5" />
                        </div>
                        <DialogTitle>
                            {isGuest ? "Get higher limits with a free account" : "Go bigger with Filego Pro"}
                        </DialogTitle>
                        <DialogDescription className="mt-2">
                            {describe(hit)}{" "}
                            {isGuest
                                ? `A free account raises this to ${formatLimitBytes(PLAN_LIMITS.free.maxFileBytes)} files and ${PLAN_LIMITS.free.maxBatchFiles} per batch. Pro goes up to ${formatLimitBytes(PLAN_LIMITS.pro.maxFileBytes)} with unlimited batches.`
                                : `Pro handles files up to ${formatLimitBytes(PLAN_LIMITS.pro.maxFileBytes)} with unlimited batches and no ads, from ₹199 a month.`}
                        </DialogDescription>

                        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            {isGuest ? (
                                <>
                                    <Button asChild variant="outline" className="rounded-xl" onClick={() => setHit(null)}>
                                        <Link href="/pricing">See Pro plans</Link>
                                    </Button>
                                    <Button asChild className="rounded-xl" onClick={() => setHit(null)}>
                                        <Link href="/register">Create free account</Link>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" className="rounded-xl" onClick={() => setHit(null)}>
                                        Not now
                                    </Button>
                                    <Button asChild className="rounded-xl" onClick={() => setHit(null)}>
                                        <Link href="/pricing">See Pro plans</Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
