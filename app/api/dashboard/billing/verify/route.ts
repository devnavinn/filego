import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-provider";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayPayment } from "@/lib/razorpay";
import { activatePass } from "@/lib/entitlements";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => null);

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

        const owned = await prisma.subscription.findFirst({
            where: { userId, providerOrderId: razorpayOrderId },
            select: { id: true },
        });

        if (!owned) {
            return NextResponse.json(
                { ok: false, error: "Subscription not found" },
                { status: 404 }
            );
        }

        const result = await activatePass({
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
            signature: razorpaySignature,
        });

        return NextResponse.json({ ok: true, alreadyVerified: result.status === "already_active" });
    } catch (error) {
        console.error("[BILLING_VERIFY_ERROR]", error);

        return NextResponse.json(
            { ok: false, error: "Failed to verify payment" },
            { status: 500 }
        );
    }
}
