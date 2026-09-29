"use client";

import { useActionState, useEffect, useEffectEvent, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import {
    changePassword,
    deleteAccount,
    updateProfile,
    type ActionState,
} from "@/app/(dashboard)/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Toasts each new result of a server action. */
function useActionToast(state: ActionState, onSuccess?: () => void) {
    const handleResult = useEffectEvent((result: NonNullable<ActionState>) => {
        if (result.ok) {
            toast.success(result.message);
            onSuccess?.();
        } else {
            toast.error(result.message);
        }
    });

    useEffect(() => {
        if (state) handleResult(state);
    }, [state]);
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
    const { update } = useSession();
    const [state, formAction, pending] = useActionState(updateProfile, null);

    // Pull the new name into the JWT so the navbar and menus pick it up.
    useActionToast(state, () => void update());

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={name} required minLength={2} maxLength={80} className="rounded-xl" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} disabled className="rounded-xl" />
                <p className="text-xs text-muted-foreground">Your email is used to sign in and can’t be changed here.</p>
            </div>

            <Button type="submit" disabled={pending} className="rounded-xl">
                {pending ? "Saving..." : "Save changes"}
            </Button>
        </form>
    );
}

export function PasswordForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction, pending] = useActionState(changePassword, null);

    useActionToast(state, () => formRef.current?.reset());

    return (
        <form ref={formRef} action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required className="rounded-xl" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className="rounded-xl" />
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                At least 8 characters with an uppercase letter, a lowercase letter and a number.
            </p>

            <Button type="submit" disabled={pending} className="rounded-xl">
                {pending ? "Updating..." : "Change password"}
            </Button>
        </form>
    );
}

export function DeleteAccountForm({ isPro }: { isPro: boolean }) {
    const [confirm, setConfirm] = useState("");
    const [state, formAction, pending] = useActionState(deleteAccount, null);

    useActionToast(state, () => void signOut({ callbackUrl: "/" }));

    return (
        <form action={formAction} className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
                This permanently deletes your account, processing history and settings.
                {isPro ? " Your remaining Pro time is forfeited and can’t be refunded or restored." : ""}
            </p>

            <div className="space-y-2">
                <Label htmlFor="confirm">
                    Type <span className="font-mono font-semibold">DELETE</span> to confirm
                </Label>
                <Input
                    id="confirm"
                    name="confirm"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    autoComplete="off"
                    className="rounded-xl sm:max-w-xs"
                />
            </div>

            <Button type="submit" variant="destructive" disabled={pending || confirm !== "DELETE"} className="rounded-xl">
                {pending ? "Deleting..." : "Delete account"}
            </Button>
        </form>
    );
}
