import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-provider";
import { redirect } from "next/navigation";

export async function requireUser() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    return session;
}

export async function requireAdmin() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
        redirect("/dashboard");
    }

    return session;
}