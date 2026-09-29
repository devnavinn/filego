"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DeleteBlogPostButton({
    postId,
    title,
    redirectTo,
}: {
    postId: string;
    title: string;
    /** Where to go after deleting; stays on the page and refreshes when omitted. */
    redirectTo?: string;
}) {
    const router = useRouter();
    const [pending, setPending] = useState(false);

    async function handleDelete() {
        if (!window.confirm(`Delete “${title}”? This can’t be undone.`)) return;

        setPending(true);
        try {
            const res = await fetch(`/api/admin/blog/${postId}`, { method: "DELETE" });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                toast.error(data?.error || "Could not delete the post.");
                return;
            }

            toast.success("Post deleted.");
            if (redirectTo) router.push(redirectTo);
            router.refresh();
        } catch {
            toast.error("Could not delete the post.");
        } finally {
            setPending(false);
        }
    }

    return (
        <Button type="button" variant="ghost" onClick={handleDelete} disabled={pending} className="rounded-xl text-destructive hover:text-destructive">
            <Trash2 className="mr-2 size-4" />
            {pending ? "Deleting..." : "Delete"}
        </Button>
    );
}
