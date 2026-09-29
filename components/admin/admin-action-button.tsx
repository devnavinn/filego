"use client";

import { useActionState, useEffect, useEffectEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AdminActionState } from "@/app/(admin)/admin/actions";

type AdminActionButtonProps = {
    action: (prev: AdminActionState, formData: FormData) => Promise<AdminActionState>;
    fields: Record<string, string>;
    /** Asks before running when set; use for destructive or hard-to-undo actions. */
    confirm?: string;
    variant?: React.ComponentProps<typeof Button>["variant"];
    size?: React.ComponentProps<typeof Button>["size"];
    className?: string;
    children: React.ReactNode;
};

export function AdminActionButton({
    action,
    fields,
    confirm,
    variant = "outline",
    size = "sm",
    className,
    children,
}: AdminActionButtonProps) {
    const [state, formAction, pending] = useActionState(action, null);

    const showResult = useEffectEvent((result: NonNullable<AdminActionState>) => {
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
    });

    useEffect(() => {
        if (state) showResult(state);
    }, [state]);

    return (
        <form
            action={formAction}
            onSubmit={(event) => {
                if (confirm && !window.confirm(confirm)) event.preventDefault();
            }}
        >
            {Object.entries(fields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
            ))}
            <Button type="submit" variant={variant} size={size} disabled={pending} className={className ?? "rounded-xl"}>
                {children}
            </Button>
        </form>
    );
}
