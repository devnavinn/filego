import { NextResponse } from "next/server";
import { BillingStatus, PlanType } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PLAN_CONFIG = {
    LIFETIME: { planType: PlanType.LIFETIME, amount: 99900, product: "filego-lifetime" },
    PRO_MONTHLY: { planType: PlanType.PRO, amount: 100000, product: "filego-pro-monthly" },
    PRO_YEARLY: { planType: PlanType.PRO, amount: 999900, product: "filego-pro-yearly" },
} as const;

type PlanKey = keyof typeof PLAN_CONFIG;

export async function POST(req: Request) {
    try {
        const user = await requireUser();

        if (!razorpay) {
            return NextResponse.json(
                { ok: false, message: "Billing not configured" },
                { status: 500 }
            );
        }

        const body = await req.json().catch(() => null);
        const planKey: PlanKey = body?.plan in PLAN_CONFIG ? body.plan : "LIFETIME";
        const plan = PLAN_CONFIG[planKey];

        const receipt = `fg_${user.id.slice(-8)}_${Date.now().toString().slice(-8)}`;

        const order = await razorpay.orders.create({
            amount: plan.amount,
            currency: "INR",
            receipt,
            notes: {
                userId: user.id,
                planType: plan.planType,
                plan: planKey,
                product: plan.product,
            },
        });

        const amount = Number(order.amount);

        const existingSubscription = await prisma.subscription.findFirst({
            where: {
                userId: user.id,
                planType: plan.planType,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (existingSubscription) {
            await prisma.subscription.update({
                where: { id: existingSubscription.id },
                data: {
                    billingStatus: BillingStatus.INACTIVE,
                    provider: "RAZORPAY",
                    providerOrderId: order.id,
                    providerPaymentId: null,
                    amount,
                    currency: order.currency,
                    purchasedAt: null,
                    startsAt: null,
                },
            });
        } else {
            await prisma.subscription.create({
                data: {
                    userId: user.id,
                    planType: plan.planType,
                    billingStatus: BillingStatus.INACTIVE,
                    provider: "RAZORPAY",
                    providerOrderId: order.id,
                    providerPaymentId: null,
                    amount,
                    currency: order.currency,
                },
            });
        }

        return NextResponse.json({
            ok: true,
            data: {
                orderId: order.id,
                amount,
                currency: order.currency,
                key: process.env.RAZORPAY_KEY_ID,
                planType: plan.planType,
                plan: planKey,
                prefill: {
                    name: user.name ?? "",
                    email: user.email ?? "",
                },
            },
        });
    } catch (error) {
        console.error("[CREATE_ORDER_ERROR]", error);

        return NextResponse.json(
            { ok: false, message: "Failed to create order" },
            { status: 500 }
        );
    }
}
