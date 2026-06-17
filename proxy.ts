import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const host = req.headers.get("host") || "";
    const url = req.nextUrl.clone();

    if (host === "admin.filego.in") {
        const pathname = url.pathname;

        url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;

        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        if (token.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        return NextResponse.rewrite(url);
    }

    const pathname = req.nextUrl.pathname;

    if (!token && pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname.startsWith("/admin")) {
        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        if (token.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin/:path*",
        "/",
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};