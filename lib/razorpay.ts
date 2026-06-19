import Razorpay from "razorpay";
import crypto from "crypto";

export const razorpay =
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
        ? new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        })
        : null;

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

    const expected = crypto
        .createHmac("sha256", secret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    return expected === signature;
}