import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-provider";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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

    // The JWT role is fixed at sign-in, so confirm it against the database;
    // otherwise a demoted admin keeps access until their session expires.
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (user?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    return session.user;
}
