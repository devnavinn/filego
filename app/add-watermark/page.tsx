import { ComingSoon } from "@/components/coming-soon";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <ComingSoon
        title="Add Watermark is coming soon."
        description="We’re building a simple way to add text and image watermarks to PDFs with better placement control, opacity settings, and batch-friendly workflows."
        launchDate="2026-07-25T00:00:00"
        backHref="/"
      />
    </main>
  );
}