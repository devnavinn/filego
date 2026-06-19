import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-provider";

export async function GET() {
    const session = await getServerSession(authOptions);

    console.log("DEBUG SESSION ROUTE", session);

    return NextResponse.json(
        { session },
        {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                Pragma: "no-cache",
                Expires: "0",
            },
        }
    );
}