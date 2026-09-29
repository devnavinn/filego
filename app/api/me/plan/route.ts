import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-provider";
import { getUserPlan } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await getServerSession(authOptions);
    const plan = await getUserPlan(session?.user?.id);

    return NextResponse.json(
        {
            tier: plan.tier,
            limits: plan.limits,
            expiresAt: plan.expiresAt?.toISOString() ?? null,
            isLifetime: plan.isLifetime,
        },
        { headers: { "Cache-Control": "private, no-store" } }
    );
}
