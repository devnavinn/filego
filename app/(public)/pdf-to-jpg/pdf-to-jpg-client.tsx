"use client";

import dynamic from "next/dynamic";

const PdfToJpgTool = dynamic(
    () => import("@/components/tools/pdf-to-jpg-tool").then((m) => m.PdfToJpgTool),
    {
        ssr: false,
        loading: () => (
            <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
                <div className="rounded-[2rem] border bg-background p-8 text-sm text-muted-foreground">
                    Loading PDF to JPG tool...
                </div>
            </main>
        ),
    }
);

export function PdfToJpgClient() {
    return (
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
            <PdfToJpgTool />
        </main>
    );
}