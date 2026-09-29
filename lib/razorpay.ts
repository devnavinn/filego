import Razorpay from "razorpay";
import crypto from "crypto";

export const razorpay =
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
        ? new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        })
        : null;

function hmacMatches(secret: string, payload: string, signature: string) {
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyRazorpayPayment({
    orderId,
    paymentId,
    signature,
}: {
    orderId: string;
    paymentId: string;
    signature: string;
}) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Missing Razorpay secret");

    return hmacMatches(secret, `${orderId}|${paymentId}`, signature);
}

/** Checks the X-Razorpay-Signature header against the raw webhook body. */
export function verifyRazorpayWebhook(rawBody: string, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw new Error("Missing RAZORPAY_WEBHOOK_SECRET");

    return hmacMatches(secret, rawBody, signature);
}
