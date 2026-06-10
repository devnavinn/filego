import { ComingSoon } from "@/components/coming-soon";

export default function PdfToWordPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <ComingSoon
        title="PDF to Word is coming soon."
        description="We’re building a smoother way to convert PDFs into editable Word documents with better formatting retention, cleaner text flow, and support for document-based workflows."
        launchDate="2026-08-11T00:00:00"
        backHref="/"
      />
    </main>
  );
}