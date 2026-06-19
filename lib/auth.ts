import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-provider";
import { redirect } from "next/navigation";

export async function requireUser() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login?callbackUrl=/dashboard");
    }

    return session.user;
}

export async function requireAdmin() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login?callbackUrl=/admin");
    }

    if (session.user.role !== "ADMIN") {
        redirect("/dashboard");
    }

    return session.user;
}