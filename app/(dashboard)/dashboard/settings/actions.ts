"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { refresh } from "next/cache";
import { z } from "zod";
import { authOptions } from "@/lib/auth-provider";
import { prisma } from "@/lib/prisma";
import { resetPasswordFormSchema } from "@/lib/validations/password-reset";

export type ActionState = { ok: boolean; message: string } | null;

async function sessionUserId() {
    const session = await getServerSession(authOptions);
    return session?.user?.id ?? null;
}

const profileSchema = z.object({
    name: z.string().trim().min(2, "Enter your full name.").max(80, "Keep your name under 80 characters."),
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const userId = await sessionUserId();
    if (!userId) return { ok: false, message: "Your session expired. Sign in again." };

    const parsed = profileSchema.safeParse({ name: formData.get("name") });
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

    await prisma.user.update({ where: { id: userId }, data: { name: parsed.data.name } });
    refresh();

    return { ok: true, message: "Profile updated." };
}

const changePasswordSchema = resetPasswordFormSchema.safeExtend({
    currentPassword: z.string().min(1, "Enter your current password."),
});

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const userId = await sessionUserId();
    if (!userId) return { ok: false, message: "Your session expired. Sign in again." };

    const parsed = changePasswordSchema.safeParse({
        currentPassword: formData.get("currentPassword"),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
    if (!user?.password) {
        return { ok: false, message: "This account signs in with Google or GitHub and has no password." };
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!valid) return { ok: false, message: "Your current password is incorrect." };

    if (parsed.data.currentPassword === parsed.data.password) {
        return { ok: false, message: "Choose a password different from your current one." };
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            password: await bcrypt.hash(parsed.data.password, 12),
            passwordResetToken: null,
            passwordResetExpires: null,
        },
    });

    return { ok: true, message: "Password changed." };
}

export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const userId = await sessionUserId();
    if (!userId) return { ok: false, message: "Your session expired. Sign in again." };

    if (formData.get("confirm") !== "DELETE") {
        return { ok: false, message: 'Type DELETE to confirm.' };
    }

    // Jobs, usage, subscriptions, entitlements and OAuth links cascade with the user.
    await prisma.user.delete({ where: { id: userId } });

    return { ok: true, message: "Account deleted." };
}
