import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Scan to PDF Online | Filego",
  description:
    "Turn scanned or photographed documents into clean, organized PDF files from any device. Coming soon to Filego.",
  alternates: {
    canonical: "https://www.filego.in/scan-to-pdf",
  },
};

export default function ScanToPdfPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <ComingSoon
        title="Scan to PDF is coming soon."
        description="We’re building a simple way to scan paper documents, clean up captured pages, and turn them into organized PDF files from any device."
        launchDate="2026-08-16T00:00:00"
        backHref="/"
      />
    </main>
  );
}