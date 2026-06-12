import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/password-reset";
import {
    generatePasswordResetToken,
    getPasswordResetExpiry,
    hashPasswordResetToken,
} from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/mail/send-password-reset-email";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = forgotPasswordSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || "Invalid request." },
                { status: 400 }
            );
        }

        const { email } = parsed.data;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({
                success: true,
                message: "If an account exists, a reset link has been sent.",
            });
        }

        const rawToken = generatePasswordResetToken();
        const hashedToken = hashPasswordResetToken(rawToken);
        const expiresAt = getPasswordResetExpiry(30);

        await prisma.user.update({
            where: { email },
            data: {
                passwordResetToken: hashedToken,
                passwordResetExpires: expiresAt,
            },
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

        if (!baseUrl) {
            throw new Error("Missing NEXT_PUBLIC_APP_URL");
        }

        const resetUrl = `${baseUrl}/reset-password/${rawToken}`;

        await sendPasswordResetEmail({
            email: user.email,
            name: user.name || "there",
            resetUrl,
        });

        return NextResponse.json({
            success: true,
            message: "If an account exists, a reset link has been sent.",
        });
    } catch (error) {
        console.error("forgot-password error:", error);

        return NextResponse.json(
            { error: "Unable to process password reset request." },
            { status: 500 }
        );
    }
}