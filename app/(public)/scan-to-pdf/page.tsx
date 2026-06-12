import { ComingSoon } from "@/components/coming-soon";

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