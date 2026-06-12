import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/password-reset";
import { hashPasswordResetToken } from "@/lib/auth/password-reset";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = resetPasswordSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || "Invalid request." },
                { status: 400 }
            );
        }

        const { token, password } = parsed.data;

        const hashedToken = hashPasswordResetToken(token);

        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpires: {
                    gte: new Date(),
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "This reset link is invalid or has expired." },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Password updated successfully.",
        });
    } catch {
        return NextResponse.json(
            { error: "Unable to reset password." },
            { status: 500 }
        );
    }
}