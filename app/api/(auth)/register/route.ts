import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { generateOtp, getOtpExpiryDate, hashOtp } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/mail/send-otp-email";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || "Invalid form data." },
                { status: 400 }
            );
        }

        const { name, email, password } = parsed.data;

        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true, emailVerified: true },
        });

        if (existingUser?.emailVerified) {
            return NextResponse.json(
                { error: "An account with this email already exists." },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const otp = generateOtp();
        const otpHash = await hashOtp(otp);
        const expiresAt = getOtpExpiryDate(10);
        const now = new Date();

        await prisma.emailOtpVerification.upsert({
            where: { email },
            update: {
                name,
                passwordHash,
                otpHash,
                expiresAt,
                attempts: 0,
                lastSentAt: now,
            },
            create: {
                email,
                name,
                passwordHash,
                otpHash,
                expiresAt,
                attempts: 0,
                lastSentAt: now,
            },
        });

        try {
            await sendOtpEmail({ email, name, otp });
        } catch (emailError) {
            console.error("sendOtpEmail failed:", emailError);

            return NextResponse.json(
                { error: "Failed to send verification email." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Verification code sent.",
        });
    } catch (error) {
        console.error("/api/register failed:", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Unable to process registration.",
            },
            { status: 500 }
        );
    }
}