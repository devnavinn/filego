import { NextResponse } from "next/server";
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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        const razorpayOrderId = body?.razorpay_order_id;
        const razorpayPaymentId = body?.razorpay_payment_id;
        const razorpaySignature = body?.razorpay_signature;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return NextResponse.json(
                { error: "Missing payment fields" },
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
                { error: "Invalid payment signature" },
                { status: 400 }
            );
        }

        const subscription = await prisma.subscription.findFirst({
            where: {
                userId,
                planType: "LIFETIME",
                providerOrderId: razorpayOrderId,
            },
        });

        if (!subscription) {
            return NextResponse.json(
                { error: "Subscription not found" },
                { status: 404 }
            );
        }

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                billingStatus: "ACTIVE",
                providerPaymentId: razorpayPaymentId,
                purchasedAt: new Date(),
                startsAt: new Date(),
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[BILLING_VERIFY_ERROR]", error);
        return NextResponse.json(
            { error: "Failed to verify payment" },
            { status: 500 }
        );
    }
}