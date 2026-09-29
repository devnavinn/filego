import { NextResponse } from "next/server";
import { BillingStatus, PlanType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/entitlements";
import { sendProExpiryEmail } from "@/lib/mail/send-pro-expiry-email";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Runs daily (see vercel.json). Emails users whose Pro access ends in 3 days.
 * The window is one day wide, so each pass gets exactly one reminder.
 */
export async function GET(req: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
        return NextResponse.json({ ok: false }, { status: 401 });
    }

    const now = Date.now();
    const windowStart = new Date(now + 3 * DAY_MS);
    const windowEnd = new Date(now + 4 * DAY_MS);

    const expiring = await prisma.subscription.findMany({
        where: {
            planType: PlanType.PRO,
            billingStatus: BillingStatus.ACTIVE,
            expiresAt: { gte: windowStart, lt: windowEnd },
        },
        select: {
            userId: true,
            expiresAt: true,
            user: { select: { email: true, name: true } },
        },
    });

    let sent = 0;
    let failed = 0;

    for (const sub of expiring) {
        // Skip users who already bought a pass that extends past this one.
        const plan = await getUserPlan(sub.userId);
        if (plan.isLifetime || !plan.expiresAt || plan.expiresAt.getTime() !== sub.expiresAt?.getTime()) {
            continue;
        }

        try {
            await sendProExpiryEmail({
                email: sub.user.email,
                name: sub.user.name ?? "",
                expiresAt: plan.expiresAt,
            });
            sent++;
        } catch (error) {
            failed++;
            console.error("[PRO_EXPIRY_REMINDER_ERROR]", sub.userId, error);
        }
    }

    return NextResponse.json({ ok: true, candidates: expiring.length, sent, failed });
}
