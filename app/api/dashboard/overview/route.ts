import { NextResponse } from "next/server";
import { getDashboardOverview } from "@/lib/dashboard";
import { requireUser } from "@/lib/auth";

export async function GET() {
    try {
        const user = await requireUser();
        const data = await getDashboardOverview(user.id);
        return NextResponse.json({ ok: true, data });
    } catch (error) {
        return NextResponse.json(
            { ok: false, message: "Unauthorized" },
            { status: 401 }
        );
    }
}