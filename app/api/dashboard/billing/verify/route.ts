import crypto from "crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const user = await requireUser();
        const body = await req.json();

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            planType = "LIFETIME",
        } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json(
                { ok: false, message: "Missing payment details" },
                { status: 400 }
            );
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;

        if (!secret) {
            return NextResponse.json(
                { ok: false, message: "Billing secret not configured" },
                { status: 500 }
            );
        }

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json(
                { ok: false, message: "Invalid payment signature" },
                { status: 400 }
            );
        }

        await prisma.$transaction(async (tx) => {
            await tx.subscription.upsert({
                where: {
                    userId_planType: {
                        userId: user.id,
                        planType: "LIFETIME",
                    },
                },
                create: {
                    userId: user.id,
                    planType: "LIFETIME",
                    billingStatus: "ACTIVE",
                    provider: "razorpay",
                    providerOrderId: razorpay_order_id,
                    providerPaymentId: razorpay_payment_id,
                    purchasedAt: new Date(),
                    startsAt: new Date(),
                },
                update: {
                    billingStatus: "ACTIVE",
                    provider: "razorpay",
                    providerOrderId: razorpay_order_id,
                    providerPaymentId: razorpay_payment_id,
                    purchasedAt: new Date(),
                    startsAt: new Date(),
                },
            });

            await tx.featureEntitlement.upsert({
                where: {
                    userId_key: {
                        userId: user.id,
                        key: "bulk_image_compress",
                    },
                },
                create: {
                    userId: user.id,
                    key: "bulk_image_compress",
                    enabled: true,
                },
                update: {
                    enabled: true,
                },
            });
        });

        return NextResponse.json({
            ok: true,
            message: "Payment verified successfully",
        });
    } catch (error) {
        console.error("[VERIFY_BILLING_ERROR]", error);

        return NextResponse.json(
            { ok: false, message: "Payment verification failed" },
            { status: 500 }
        );
    }
}