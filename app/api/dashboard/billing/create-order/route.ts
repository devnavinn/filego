import { NextResponse } from "next/server";
import { BillingPeriod, BillingStatus, PlanType } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import type { Orders } from "razorpay/dist/types/orders";
import { razorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { PRO_PASSES, isPassKey } from "@/lib/plans";
import { countryFromHeaders } from "@/lib/geo";
import { getPricing } from "@/lib/pricing";
import { CREDIT_PACKS, isCreditPackKey } from "@/lib/photo-credits";

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
        const packKey: unknown = body?.pack;
        const pass = isPassKey(planKey) ? PRO_PASSES[planKey] : null;
        const pack = isCreditPackKey(packKey) ? CREDIT_PACKS[packKey] : null;

        if (!pass && !pack) {
            return NextResponse.json(
                { ok: false, error: "Unknown plan" },
                { status: 400 }
            );
        }

        // The price always comes from the server's view of the buyer's country, never from the browser.
        const pricing = getPricing(countryFromHeaders(req.headers));
        const priceAmount = pass ? pricing.passes[pass.key].amount : pricing.packs[pack!.key].amount;

        // The page showed prices for another country (e.g. the buyer switched network or VPN).
        if (typeof body?.currency === "string" && body.currency !== pricing.currency) {
            return NextResponse.json(
                { ok: false, error: "Prices for your location have changed. Please refresh the page.", code: "PRICE_CHANGED" },
                { status: 409 }
            );
        }

        const receipt = `fg_${user.id.slice(-8)}_${Date.now().toString().slice(-8)}`;

        let order: Orders.RazorpayOrder;
        try {
            order = await razorpay.orders.create({
                amount: priceAmount,
                currency: pricing.currency,
                receipt,
                notes: {
                    userId: user.id,
                    ...(pass ? { planType: PlanType.PRO, plan: pass.key } : { product: "PHOTO_CREDITS", pack: pack!.key }),
                    country: pricing.country ?? "unknown",
                    pricingRegion: pricing.region,
                },
            });
        } catch (error) {
            // Most often: international payments aren't enabled on the Razorpay account for this currency.
            console.error("[CREATE_ORDER_RAZORPAY_ERROR]", { currency: pricing.currency, country: pricing.country }, error);
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        pricing.currency === "INR"
                            ? "Failed to create order"
                            : `Payments in ${pricing.currency} aren't available right now. Please try again later or contact support.`,
                },
                { status: 502 }
            );
        }

        const amount = Number(order.amount);

        if (pass) {
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
        } else {
            await prisma.photoCreditPurchase.create({
                data: {
                    userId: user.id,
                    pack: pack!.key,
                    credits: pack!.credits,
                    providerOrderId: order.id,
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
                plan: pass?.key ?? null,
                pack: pack?.key ?? null,
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
