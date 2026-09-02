import { NextResponse } from "next/server";
import { BillingStatus } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-provider";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayPayment } from "@/lib/razorpay";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        const userId =
            (session as { id?: string; user?: { id?: string } } | null)?.id ??
            (session as { user?: { id?: string } } | null)?.user?.id ??
            null;

        if (!userId) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        const razorpayOrderId = body?.razorpay_order_id;
        const razorpayPaymentId = body?.razorpay_payment_id;
        const razorpaySignature = body?.razorpay_signature;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return NextResponse.json(
                { ok: false, error: "Missing payment fields" },
                { status: 400 }
            );
        }

        const valid = verifyRazorpayPayment({
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
            signature: razorpaySignature,
        });

        if (!valid) {
            return NextResponse.json(
                { ok: false, error: "Invalid payment signature" },
                { status: 400 }
            );
        }

        const subscription = await prisma.subscription.findFirst({
            where: {
                userId,
                providerOrderId: razorpayOrderId,
            },
        });

        if (!subscription) {
            return NextResponse.json(
                { ok: false, error: "Subscription not found" },
                { status: 404 }
            );
        }

        if (
            subscription.billingStatus === BillingStatus.ACTIVE &&
            subscription.providerPaymentId === razorpayPaymentId
        ) {
            return NextResponse.json({ ok: true, alreadyVerified: true });
        }

        const now = new Date();
        // PRO plans are billed monthly (₹1000) or yearly (₹9999); LIFETIME never expires.
        const expiresAt =
            subscription.planType === "PRO"
                ? new Date(now.getTime() + (subscription.amount === 999900 ? 365 : 30) * 24 * 60 * 60 * 1000)
                : null;

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                billingStatus: BillingStatus.ACTIVE,
                providerPaymentId: razorpayPaymentId,
                purchasedAt: now,
                startsAt: now,
                expiresAt,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[BILLING_VERIFY_ERROR]", error);

        return NextResponse.json(
            { ok: false, error: "Failed to verify payment" },
            { status: 500 }
        );
    }
}