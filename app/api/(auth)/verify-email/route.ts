import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { compareOtp } from "@/lib/auth/otp";
import { verifyEmailSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = verifyEmailSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || "Invalid request." },
                { status: 400 }
            );
        }

        const { email, otp } = parsed.data;

        const record = await prisma.emailOtpVerification.findUnique({
            where: { email },
        });

        if (!record) {
            return NextResponse.json(
                { error: "Verification request not found." },
                { status: 404 }
            );
        }

        if (record.attempts >= 5) {
            return NextResponse.json(
                { error: "Too many attempts. Request a new code." },
                { status: 429 }
            );
        }

        if (record.expiresAt < new Date()) {
            return NextResponse.json(
                { error: "Code expired. Request a new one." },
                { status: 400 }
            );
        }

        const isValid = await compareOtp(otp, record.otpHash);

        if (!isValid) {
            await prisma.emailOtpVerification.update({
                where: { email },
                data: {
                    attempts: {
                        increment: 1,
                    },
                },
            });

            return NextResponse.json(
                { error: "Invalid verification code." },
                { status: 400 }
            );
        }

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                name: record.name,
                password: record.passwordHash,
                emailVerified: new Date(),
            },
            create: {
                name: record.name,
                email,
                password: record.passwordHash,
                emailVerified: new Date(),
                role: "USER",
            },
        });

        await prisma.emailOtpVerification.delete({
            where: { email },
        });

        return NextResponse.json({
            success: true,
            userId: user.id,
        });
    } catch {
        return NextResponse.json(
            { error: "Unable to verify email." },
            { status: 500 }
        );
    }
}