import { NextResponse } from "next/server";
import { verifyRazorpayWebhook } from "@/lib/razorpay";
import { activatePass } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

type RazorpayWebhookEvent = {
    event: string;
    payload?: {
        payment?: { entity?: { id?: string; order_id?: string; status?: string } };
    };
};

/**
 * Backup activation path for when the buyer closes the tab before the
 * checkout handler calls /api/dashboard/billing/verify.
 * Subscribe to `payment.captured` and `order.paid` in the Razorpay dashboard.
 */
export async function POST(req: Request) {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature || !verifyRazorpayWebhook(rawBody, signature)) {
        return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    let event: RazorpayWebhookEvent;
    try {
        event = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    if (event.event !== "payment.captured" && event.event !== "order.paid") {
        return NextResponse.json({ ok: true, ignored: event.event });
    }

    const payment = event.payload?.payment?.entity;

    if (!payment?.id || !payment.order_id) {
        return NextResponse.json({ ok: true, ignored: "no order" });
    }

    try {
        const result = await activatePass({ orderId: payment.order_id, paymentId: payment.id });
        // Orders without a subscription row aren't ours to handle; acknowledge so Razorpay stops retrying.
        return NextResponse.json({ ok: true, status: result.status });
    } catch (error) {
        console.error("[RAZORPAY_WEBHOOK_ERROR]", error);
        // Non-2xx makes Razorpay retry.
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
