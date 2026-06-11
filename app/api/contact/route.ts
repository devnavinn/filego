// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactFormSchema } from "@/lib/validations/contact";

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const parsed = contactFormSchema.safeParse(json);

        if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors;

            return NextResponse.json(
                {
                    ok: false,
                    error: "Validation failed.",
                    fieldErrors,
                },
                { status: 400 }
            );
        }

        const data = parsed.data;

        const submission = await prisma.contactSubmission.create({
            data: {
                name: data.name,
                email: data.email,
                subject: data.subject || null,
                message: data.message,
                phone: data.phone || null,
                company: data.company || null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                subject: true,
                message: true,
                phone: true,
                company: true,
                createdAt: true,
            },
        });

        return NextResponse.json(
            {
                ok: true,
                id: submission.id,
                message: "Contact submission created successfully.",
            },
            { status: 201 }
        );
    } catch {
        return NextResponse.json(
            {
                ok: false,
                error: "Something went wrong. Please try again.",
            },
            { status: 500 }
        );
    }
}