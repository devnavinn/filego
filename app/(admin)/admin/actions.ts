"use server";

import { BillingStatus, ContactStatus, PlanType, Role } from "@prisma/client";
import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getUserPlan } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";

export type AdminActionState = { ok: boolean; message: string } | null;

const DAY_MS = 24 * 60 * 60 * 1000;
const GRANT_DAYS = new Set([30, 365]);

function field(formData: FormData, name: string) {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
}

export async function setUserRole(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
    const admin = await requireAdmin();
    const userId = field(formData, "userId");
    const role = field(formData, "role");

    if (role !== Role.ADMIN && role !== Role.USER) return { ok: false, message: "Unknown role." };
    if (userId === admin.id) return { ok: false, message: "You can’t change your own role." };

    const { count } = await prisma.user.updateMany({ where: { id: userId }, data: { role } });
    if (count === 0) return { ok: false, message: "User not found." };

    refresh();
    return {
        ok: true,
        message: role === Role.ADMIN
            ? "Promoted to admin. They need to sign in again to open the admin area."
            : "Admin access removed.",
    };
}

/** Gives a user free Pro time, stacked after any pass they already have. */
export async function grantPro(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
    await requireAdmin();
    const userId = field(formData, "userId");
    const days = Number(field(formData, "days"));

    if (!GRANT_DAYS.has(days)) return { ok: false, message: "Choose 30 or 365 days." };

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return { ok: false, message: "User not found." };

    const plan = await getUserPlan(userId);
    if (plan.isLifetime) return { ok: false, message: "This user already has lifetime Pro." };

    const now = new Date();
    const startsAt = plan.expiresAt && plan.expiresAt > now ? plan.expiresAt : now;
    const expiresAt = new Date(startsAt.getTime() + days * DAY_MS);

    await prisma.subscription.create({
        data: {
            userId,
            planType: PlanType.PRO,
            billingStatus: BillingStatus.ACTIVE,
            provider: "ADMIN",
            amount: 0,
            purchasedAt: now,
            startsAt,
            expiresAt,
        },
    });

    refresh();
    return { ok: true, message: `Granted ${days} days of Pro, until ${expiresAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}.` };
}

/** Records a refund made in the Razorpay dashboard and ends the Pro time it paid for. */
export async function markPaymentRefunded(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
    await requireAdmin();
    const id = field(formData, "subscriptionId");

    const { count } = await prisma.subscription.updateMany({
        where: { id, billingStatus: BillingStatus.ACTIVE },
        data: { billingStatus: BillingStatus.REFUNDED },
    });
    if (count === 0) return { ok: false, message: "Only active payments can be marked refunded." };

    refresh();
    return { ok: true, message: "Pass ended. The Pro access it gave has been removed." };
}

export async function setContactStatus(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
    await requireAdmin();
    const id = field(formData, "id");
    const status = field(formData, "status");

    if (!(status in ContactStatus)) return { ok: false, message: "Unknown status." };

    const { count } = await prisma.contactSubmission.updateMany({
        where: { id },
        data: { status: status as ContactStatus },
    });
    if (count === 0) return { ok: false, message: "Message not found." };

    refresh();
    return { ok: true, message: `Marked ${status.toLowerCase()}.` };
}

export async function deleteContact(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
    await requireAdmin();
    const { count } = await prisma.contactSubmission.deleteMany({ where: { id: field(formData, "id") } });
    if (count === 0) return { ok: false, message: "Message not found." };

    refresh();
    return { ok: true, message: "Message deleted." };
}

export async function deleteSubscriber(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
    await requireAdmin();
    const { count } = await prisma.waitlistSubscriber.deleteMany({ where: { id: field(formData, "id") } });
    if (count === 0) return { ok: false, message: "Subscriber not found." };

    refresh();
    return { ok: true, message: "Subscriber removed." };
}
