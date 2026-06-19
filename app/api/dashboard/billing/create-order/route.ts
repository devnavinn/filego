import { NextResponse } from "next/server";
import { BillingStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const LIFETIME_PRICE_INR_PAISE = 99900;

export async function POST() {
    try {
        const user = await requireUser();

        if (!razorpay) {
            return NextResponse.json(
                { ok: false, message: "Billing not configured" },
                { status: 500 }
            );
        }

        const receipt = `fg_${user.id.slice(-8)}_${Date.now().toString().slice(-8)}`;

        const order = await razorpay.orders.create({
            amount: LIFETIME_PRICE_INR_PAISE,
            currency: "INR",
            receipt,
            notes: {
                userId: user.id,
                planType: "LIFETIME",
                product: "filego-lifetime",
            },
        });

        const amount = Number(order.amount);

        const existingSubscription = await prisma.subscription.findFirst({
            where: {
                userId: user.id,
                planType: "LIFETIME",
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
                    planType: "LIFETIME",
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
                planType: "LIFETIME",
                prefill: {
                    name: user.name ?? "",
                    email: user.email ?? "",
                },
            },
        });
    } catch (error) {
        console.error("[CREATE_LIFETIME_ORDER_ERROR]", error);

        return NextResponse.json(
            { ok: false, message: "Failed to create order" },
            { status: 500 }
        );
    }
}