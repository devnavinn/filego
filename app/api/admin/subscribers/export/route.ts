import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvCell(value: string | null) {
    const text = value ?? "";
    // Quote everything and neutralise leading formula characters for spreadsheet apps.
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET() {
    await requireAdmin();

    const rows = await prisma.waitlistSubscriber.findMany({
        orderBy: { createdAt: "desc" },
        select: { email: true, source: true, page: true, createdAt: true },
    });

    const lines = [
        ["email", "source", "page", "subscribed_at"].join(","),
        ...rows.map((row) =>
            [csvCell(row.email), csvCell(row.source), csvCell(row.page), csvCell(row.createdAt.toISOString())].join(",")
        ),
    ];

    const date = new Date().toISOString().slice(0, 10);

    return new Response(lines.join("\n"), {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="filego-subscribers-${date}.csv"`,
            "Cache-Control": "no-store",
        },
    });
}
