import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

const LIFETIME_PRICE_INR_PAISE = 49000;

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

        return NextResponse.json({
            ok: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                key: process.env.RAZORPAY_KEY_ID,
                planType: "LIFETIME",
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