import { ComingSoon } from "@/components/coming-soon";

export default function SplitPdfPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <ComingSoon
        title="Split PDF is coming soon."
        description="We’re building a simple way to split large PDFs, extract selected pages, and break documents into smaller files with less manual work."
        launchDate="2026-08-13T00:00:00"
        backHref="/"
      />
    </main>
  );
}