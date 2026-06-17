import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const host = req.headers.get("host") || "";
    const pathname = req.nextUrl.pathname;
    const url = req.nextUrl.clone();

    const isAuthPath =
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/forgot-password");

    if (host === "admin.filego.in") {
        if (isAuthPath) {
            return NextResponse.next();
        }

        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        if (token.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        if (!pathname.startsWith("/admin")) {
            url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
            return NextResponse.rewrite(url);
        }

        return NextResponse.next();
    }

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
        "/",
        "/login",
        "/register",
        "/forgot-password",
        "/dashboard/:path*",
        "/admin/:path*",
        "/blog/:path*",
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};