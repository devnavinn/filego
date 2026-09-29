import { NextResponse } from "next/server";
import { BillingPeriod, BillingStatus, PlanType } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { PRO_PASSES, isPassKey } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const user = await requireUser();

        if (!razorpay) {
            return NextResponse.json(
                { ok: false, error: "Billing not configured" },
                { status: 500 }
            );
        }

        const body = await req.json().catch(() => null);
        const planKey: unknown = body?.plan;

        if (!isPassKey(planKey)) {
            return NextResponse.json(
                { ok: false, error: "Unknown plan" },
                { status: 400 }
            );
        }

        const pass = PRO_PASSES[planKey];
        const receipt = `fg_${user.id.slice(-8)}_${Date.now().toString().slice(-8)}`;

        const order = await razorpay.orders.create({
            amount: pass.amount,
            currency: "INR",
            receipt,
            notes: {
                userId: user.id,
                planType: PlanType.PRO,
                plan: pass.key,
            },
        });

        const amount = Number(order.amount);

        // One row per order, so renewals keep their own history.
        await prisma.subscription.create({
            data: {
                userId: user.id,
                planType: PlanType.PRO,
                billingPeriod: BillingPeriod[pass.period],
                billingStatus: BillingStatus.INACTIVE,
                provider: "RAZORPAY",
                providerOrderId: order.id,
                amount,
                currency: order.currency,
            },
        });

        return NextResponse.json({
            ok: true,
            data: {
                orderId: order.id,
                amount,
                currency: order.currency,
                key: process.env.RAZORPAY_KEY_ID,
                plan: pass.key,
                prefill: {
                    name: user.name ?? "",
                    email: user.email ?? "",
                },
            },
        });
    } catch (error) {
        console.error("[CREATE_ORDER_ERROR]", error);

        return NextResponse.json(
            { ok: false, error: "Failed to create order" },
            { status: 500 }
        );
    }
}
