import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { generateOtp, getOtpExpiryDate, hashOtp } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/mail/send-otp-email";
import { resendOtpSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = resendOtpSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || "Invalid request." },
                { status: 400 }
            );
        }

        const { email } = parsed.data;

        const record = await prisma.emailOtpVerification.findUnique({
            where: { email },
        });

        if (!record) {
            return NextResponse.json(
                { error: "No pending verification found." },
                { status: 404 }
            );
        }

        const cooldownMs = 60 * 1000;
        const now = Date.now();
        const lastSent = new Date(record.lastSentAt).getTime();

        if (now - lastSent < cooldownMs) {
            return NextResponse.json(
                { error: "Please wait before requesting another code." },
                { status: 429 }
            );
        }

        const otp = generateOtp();
        const otpHash = await hashOtp(otp);

        await prisma.emailOtpVerification.update({
            where: { email },
            data: {
                otpHash,
                expiresAt: getOtpExpiryDate(10),
                attempts: 0,
                lastSentAt: new Date(),
            },
        });

        await sendOtpEmail({
            email,
            name: record.name,
            otp,
        });

        return NextResponse.json({
            success: true,
            message: "A new code has been sent.",
        });
    } catch {
        return NextResponse.json(
            { error: "Unable to resend code." },
            { status: 500 }
        );
    }
}