import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { notifySchema } from "@/lib/validations/notify";

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const data = notifySchema.parse(json);

        const email = data.email.toLowerCase();
        const existing = await prisma.waitlistSubscriber.findUnique({
            where: { email },
        });

        if (existing) {
            return NextResponse.json({
                ok: true,
                message: "You are already on the list.",
            });
        }

        await prisma.waitlistSubscriber.create({
            data: {
                email,
                source: data.source ?? "coming-soon",
                page: data.page ?? null,
            },
        });

        return NextResponse.json(
            {
                ok: true,
                message: "You’re on the list. We’ll let you know when it launches.",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/notify failed:", error);

        if (error instanceof ZodError) {
            const fieldErrors = error.flatten().fieldErrors;

            return NextResponse.json(
                {
                    ok: false,
                    error: "Please correct the highlighted fields.",
                    fieldErrors,
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                ok: false,
                error: "Something went wrong. Please try again.",
            },
            { status: 500 }
        );
    }
}