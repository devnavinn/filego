import { ComingSoon } from "@/components/coming-soon";

export default function PdfFormsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <ComingSoon
        title="PDF Forms is coming soon."
        description="We’re building a simple way to fill PDF forms, add text fields and checkboxes, and complete documents faster without printing or scanning."
        launchDate="2026-08-14T00:00:00"
        backHref="/"
      />
    </main>
  );
}